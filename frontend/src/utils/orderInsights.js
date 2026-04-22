const STATUS_LABELS = {
  New: "New",
  Preparing: "Prepared",
  Ready: "Ready",
  Completed: "Completed",
  Cancelled: "Cancelled",
};

const STATUS_TONES = {
  New: "blue",
  Preparing: "orange",
  Ready: "green",
  Completed: "gray",
  Cancelled: "red",
};

export function getOrderStatusLabel(status) {
  return STATUS_LABELS[status] || status || "New";
}

export function getOrderStatusTone(status) {
  return STATUS_TONES[status] || "gray";
}

export function formatCurrency(amount) {
  return `Rs. ${Number(amount || 0).toFixed(2)}`;
}

export function getOrderSummary(orders = []) {
  const todayKey = new Date().toDateString();
  const statusCounts = orders.reduce(
    (counts, order) => {
      counts[order.status || "New"] = (counts[order.status || "New"] || 0) + 1;
      return counts;
    },
    { New: 0, Preparing: 0, Ready: 0, Completed: 0, Cancelled: 0 }
  );

  const totalRevenue = orders.reduce((sum, order) => sum + Number(order.totalAmount || 0), 0);
  const totalItems = orders.reduce(
    (sum, order) => sum + Number(order.totalItems || order.qty || 0),
    0
  );
  const todayOrders = orders.filter(
    (order) => new Date(order.createdAt || Date.now()).toDateString() === todayKey
  );
  const todayRevenue = todayOrders.reduce((sum, order) => sum + Number(order.totalAmount || 0), 0);
  const todayItems = todayOrders.reduce(
    (sum, order) => sum + Number(order.totalItems || order.qty || 0),
    0
  );
  const whatsappSentCount = orders.filter((order) => Boolean(order.whatsappSent)).length;
  const paymentCompletedCount = orders.filter((order) => order.paymentStatus === "Completed").length;

  return {
    totalOrders: orders.length,
    totalRevenue,
    totalItems,
    todayOrders: todayOrders.length,
    todayRevenue,
    todayItems,
    whatsappSentCount,
    paymentCompletedCount,
    newOrders: statusCounts.New || 0,
    preparingOrders: statusCounts.Preparing || 0,
    readyOrders: statusCounts.Ready || 0,
    completedOrders: statusCounts.Completed || 0,
    cancelledOrders: statusCounts.Cancelled || 0,
    statusCounts,
  };
}

export function getTopItems(orders = [], limit = 5) {
  const itemMap = orders.reduce((map, order) => {
    (order.items || []).forEach((item) => {
      const key = String(item.itemId || item.itemName || item.name || "item");
      if (!map[key]) {
        map[key] = {
          name: item.itemName || item.name || "Item",
          qty: 0,
          revenue: 0,
        };
      }

      map[key].qty += Number(item.quantity || 0);
      map[key].revenue += Number(item.totalPrice || Number(item.price || 0) * Number(item.quantity || 0));
    });

    return map;
  }, {});

  return Object.values(itemMap)
    .sort((a, b) => b.qty - a.qty)
    .slice(0, limit);
}

export function getStallSummaries(orders = [], stalls = []) {
  const summaryMap = stalls.reduce((map, stall) => {
    map[String(stall.id)] = {
      stallId: stall.id,
      stallName: stall.stallName,
      stallOwner: stall.owner,
      orderCount: 0,
      revenue: 0,
      totalItems: 0,
      newOrders: 0,
      preparingOrders: 0,
      readyOrders: 0,
      latestOrderAt: null,
    };
    return map;
  }, {});

  orders.forEach((order) => {
    const key = String(order.stallId || "");
    if (!summaryMap[key]) {
      summaryMap[key] = {
        stallId: order.stallId,
        stallName: order.stallName || "Unknown Stall",
        stallOwner: order.stallOwner || "N/A",
        orderCount: 0,
        revenue: 0,
        totalItems: 0,
        newOrders: 0,
        preparingOrders: 0,
        readyOrders: 0,
        latestOrderAt: null,
      };
    }

    const summary = summaryMap[key];
    summary.orderCount += 1;
    summary.revenue += Number(order.totalAmount || 0);
    summary.totalItems += Number(order.totalItems || order.qty || 0);
    summary.newOrders += order.status === "New" ? 1 : 0;
    summary.preparingOrders += order.status === "Preparing" ? 1 : 0;
    summary.readyOrders += order.status === "Ready" ? 1 : 0;

    const orderTime = order.createdAt ? new Date(order.createdAt).getTime() : null;
    if (orderTime && (!summary.latestOrderAt || orderTime > summary.latestOrderAt)) {
      summary.latestOrderAt = orderTime;
    }
  });

  return Object.values(summaryMap)
    .map((summary) => ({
      ...summary,
      latestOrderAt: summary.latestOrderAt ? new Date(summary.latestOrderAt).toISOString() : null,
    }))
    .sort((a, b) => b.revenue - a.revenue);
}