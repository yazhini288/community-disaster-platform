const Request = require('../models/Request');
const Resource = require('../models/Resource');

/**
 * Maps common resource keywords to standard inventory categories
 */
const CATEGORY_KEYWORDS = {
  water: ['water', 'drinking', 'aqua', 'bottle', 'hydration'],
  food: ['food', 'meal', 'ration', 'rice', 'bread', 'canned', 'biscuit', 'baby food', 'formula', 'groceries', 'nutrition'],
  medical: ['medical', 'medicine', 'first aid', 'bandage', 'insulin', 'kit', 'drug', 'doctor', 'blood', 'pharma', 'oxygen'],
  shelter: ['shelter', 'tent', 'blanket', 'tarpaulin', 'mattress', 'sleeping bag', 'tarp'],
  clothing: ['clothing', 'clothes', 'jacket', 'shoes', 'dress', 'warm clothes']
};

/**
 * Calculate dynamic urgency & vulnerability score for a request
 */
function calculatePriorityScore(request) {
  let score = 0;

  // 1. Base Urgency Level
  const baseScores = { critical: 100, high: 65, medium: 35, low: 15 };
  score += baseScores[request.priority] || 35;

  // 2. Vulnerability tags weighting
  if (request.isVulnerable) score += 15;
  if (Array.isArray(request.vulnerabilityTags)) {
    request.vulnerabilityTags.forEach((tag) => {
      switch (tag) {
        case 'medical_dependency': score += 35; break;
        case 'child': score += 25; break;
        case 'pregnant': score += 25; break;
        case 'elderly': score += 20; break;
        case 'disabled': score += 20; break;
        default: score += 10;
      }
    });
  }

  // 3. Wait time boost (2 points per hour waiting, max 30)
  if (request.createdAt) {
    const hoursWaiting = (Date.now() - new Date(request.createdAt).getTime()) / (1000 * 60 * 60);
    score += Math.min(30, Math.floor(hoursWaiting * 2));
  }

  return score;
}

/**
 * Infer the best resource category or keyword from request description
 */
function inferCategory(resourceNeeded = '') {
  const lower = resourceNeeded.toLowerCase();
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some((kw) => lower.includes(kw))) {
      return category;
    }
  }
  return 'other';
}

/**
 * Core Automated Resource Allocation Algorithm
 * @param {Object} options
 * @param {boolean} options.dryRun - If true, calculates allocations without saving changes
 */
async function executeAllocation({ dryRun = false } = {}) {
  // 1. Fetch pending and partially allocated requests
  const requests = await Request.find({
    status: { $in: ['pending', 'approved', 'partially_allocated'] }
  }).populate('requestedBy', 'name email phone');

  // 2. Fetch available inventory resources
  const resources = await Resource.find({ quantity: { $gt: 0 } });

  // Create working copies of resource pools so dryRun and calculations stay consistent
  const resourcePool = resources.map((r) => ({
    doc: r,
    id: r._id.toString(),
    name: r.name,
    category: r.category,
    unit: r.unit || 'units',
    initialQuantity: r.quantity,
    availableQuantity: r.quantity
  }));

  // 3. Compute priority score for each request and sort descending
  const scoredRequests = requests.map((req) => {
    const priorityScore = calculatePriorityScore(req);
    return {
      doc: req,
      id: req._id.toString(),
      resourceNeeded: req.resourceNeeded,
      inferredCategory: inferCategory(req.resourceNeeded),
      quantityNeeded: req.quantity,
      currentlyAllocated: req.allocatedQuantity || 0,
      remainingNeeded: Math.max(0, req.quantity - (req.allocatedQuantity || 0)),
      priority: req.priority,
      priorityScore,
      vulnerabilityTags: req.vulnerabilityTags || [],
      isVulnerable: req.isVulnerable,
      requestedBy: req.requestedBy,
      location: req.location,
      createdAt: req.createdAt
    };
  });

  scoredRequests.sort((a, b) => b.priorityScore - a.priorityScore);

  const allocations = [];
  const deficits = [];
  const modifiedRequests = [];

  // 4. Match requests with best available resources
  for (const reqItem of scoredRequests) {
    if (reqItem.remainingNeeded <= 0) continue;

    // Search for match:
    // First: exact or substring match in name
    // Second: matching category
    // Third: any item with 'other' if needed
    let match = resourcePool.find(
      (r) =>
        r.availableQuantity > 0 &&
        (r.name.toLowerCase().includes(reqItem.resourceNeeded.toLowerCase()) ||
          reqItem.resourceNeeded.toLowerCase().includes(r.name.toLowerCase()))
    );

    if (!match) {
      match = resourcePool.find(
        (r) => r.availableQuantity > 0 && r.category === reqItem.inferredCategory
      );
    }

    if (match && match.availableQuantity > 0) {
      const allocateQty = Math.min(reqItem.remainingNeeded, match.availableQuantity);
      match.availableQuantity -= allocateQty;

      const totalAllocated = reqItem.currentlyAllocated + allocateQty;
      const isFullyAllocated = totalAllocated >= reqItem.quantityNeeded;
      const newStatus = isFullyAllocated ? 'allocated' : 'partially_allocated';

      const allocationRecord = {
        requestId: reqItem.id,
        requestedBy: reqItem.requestedBy ? reqItem.requestedBy.name : 'Anonymous',
        resourceNeeded: reqItem.resourceNeeded,
        allocatedAmount: allocateQty,
        unit: match.unit,
        totalAllocated,
        targetQuantity: reqItem.quantityNeeded,
        resourceId: match.id,
        resourceName: match.name,
        resourceCategory: match.category,
        priorityScore: reqItem.priorityScore,
        priority: reqItem.priority,
        status: newStatus
      };

      allocations.push(allocationRecord);

      // Prepare request model update
      reqItem.doc.allocatedQuantity = totalAllocated;
      reqItem.doc.allocatedResource = match.doc._id;
      reqItem.doc.allocatedAt = new Date();
      reqItem.doc.priorityScore = reqItem.priorityScore;
      reqItem.doc.status = newStatus;
      modifiedRequests.push(reqItem.doc);

      if (!isFullyAllocated) {
        deficits.push({
          requestId: reqItem.id,
          resourceNeeded: reqItem.resourceNeeded,
          shortfall: reqItem.quantityNeeded - totalAllocated,
          priority: reqItem.priority,
          priorityScore: reqItem.priorityScore,
          reason: `Insufficient inventory: only ${allocateQty} ${match.unit} of "${match.name}" was available.`
        });
      }
    } else {
      // No matching inventory available
      deficits.push({
        requestId: reqItem.id,
        resourceNeeded: reqItem.resourceNeeded,
        shortfall: reqItem.remainingNeeded,
        priority: reqItem.priority,
        priorityScore: reqItem.priorityScore,
        reason: 'Zero matching stock available in inventory.'
      });
    }
  }

  // 5. If not dryRun, persist database changes
  if (!dryRun) {
    // Save request updates
    for (const reqDoc of modifiedRequests) {
      await reqDoc.save();
    }

    // Save resource inventory updates
    for (const poolItem of resourcePool) {
      if (poolItem.availableQuantity !== poolItem.initialQuantity) {
        poolItem.doc.quantity = poolItem.availableQuantity;
        await poolItem.doc.save();
      }
    }
  }

  // 6. Generate summary statistics
  const totalAllocatedItems = allocations.reduce((sum, a) => sum + a.allocatedAmount, 0);
  const fullyMetCount = allocations.filter((a) => a.status === 'allocated').length;
  const partiallyMetCount = allocations.filter((a) => a.status === 'partially_allocated').length;
  const unmetCount = deficits.length;
  const totalProcessed = scoredRequests.length;
  const fulfillmentRate = totalProcessed > 0
    ? Math.round(((fullyMetCount + partiallyMetCount * 0.5) / totalProcessed) * 100)
    : 0;

  return {
    dryRun,
    timestamp: new Date(),
    summary: {
      totalRequestsEvaluated: totalProcessed,
      fullyAllocatedCount: fullyMetCount,
      partiallyAllocatedCount: partiallyMetCount,
      unmetRequestsCount: unmetCount,
      totalUnitsDispatched: totalAllocatedItems,
      fulfillmentRatePercentage: fulfillmentRate
    },
    allocations,
    deficits,
    remainingInventory: resourcePool.map((r) => ({
      id: r.id,
      name: r.name,
      category: r.category,
      unit: r.unit,
      dispatched: r.initialQuantity - r.availableQuantity,
      remaining: r.availableQuantity
    }))
  };
}

/**
 * Get quick allocation stats without running full allocation
 */
async function getAllocationStats() {
  const pendingRequests = await Request.countDocuments({
    status: { $in: ['pending', 'approved'] }
  });
  const allocatedRequests = await Request.countDocuments({
    status: { $in: ['allocated', 'in_transit'] }
  });
  const fulfilledRequests = await Request.countDocuments({ status: 'fulfilled' });
  const criticalPending = await Request.countDocuments({
    status: { $in: ['pending', 'approved'] },
    priority: 'critical'
  });

  const resources = await Resource.find();
  const totalStockUnits = resources.reduce((acc, r) => acc + (r.quantity || 0), 0);
  const lowStockItems = resources.filter((r) => r.quantity < 10);

  return {
    pendingRequests,
    allocatedRequests,
    fulfilledRequests,
    criticalPending,
    totalStockUnits,
    totalResourceTypes: resources.length,
    lowStockCount: lowStockItems.length,
    lowStockItems: lowStockItems.map((r) => ({ name: r.name, quantity: r.quantity, unit: r.unit }))
  };
}

module.exports = {
  calculatePriorityScore,
  executeAllocation,
  getAllocationStats
};
