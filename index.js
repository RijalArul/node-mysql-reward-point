const connection = require('./db')
const creditRewardPoints = async orderId => {
  try {
    const [order] = await connection.promise().query(
      `
      SELECT o.id, o.customer_id, o.total_amount, o.currency, c.total_reward_points 
      FROM orders o
      INNER JOIN customers c ON o.customer_id = c.id
      WHERE o.id = ? AND o.status = 'Delivered';
    `,
      [orderId]
    )

    if (order.length === 0) {
      throw new Error('Order not found or not in "Delivered" status.')
    }

    const { customer_id, total_amount, currency, total_reward_points } =
      order[0]

    const usdAmount = await convertToUSD(total_amount, currency)

    const points = Math.floor(usdAmount)

    await connection.promise().query(
      `
      UPDATE customers
      SET total_reward_points = total_reward_points + ?
      WHERE id = ?;
    `,
      [points, customer_id]
    )

    const expiryDate = new Date()
    expiryDate.setFullYear(expiryDate.getFullYear() + 1)
    await connection.promise().query(
      `
      INSERT INTO reward_points (customer_id, order_id, points, expiry_date)
      VALUES (?, ?, ?, ?);
    `,
      [customer_id, orderId, points, expiryDate]
    )

    console.log(
      `Successfully credited ${points} points to customer ID ${customer_id}.`
    )
  } catch (error) {
    console.error('Error crediting reward points:', error.message)
  }
}

const deductRewardPoints = async (customerId, pointsToDeduct) => {
  try {
    const [customer] = await connection.promise().query(
      `
      SELECT total_reward_points
      FROM customers
      WHERE id = ?;
    `,
      [customerId]
    )

    if (customer.length === 0) {
      throw new Error('Customer not found.')
    }

    const { total_reward_points } = customer[0]

    if (pointsToDeduct > total_reward_points) {
      throw new Error('Not enough reward points.')
    }

    await connection.promise().query(
      `
      UPDATE customers
      SET total_reward_points = total_reward_points - ?
      WHERE id = ?;
    `,
      [pointsToDeduct, customerId]
    )

    console.log(
      `Successfully deducted ${pointsToDeduct} points from customer ID ${customerId}.`
    )
  } catch (error) {
    console.error('Error deducting reward points:', error.message)
  }
}

const convertToUSD = async (amount, currency) => {
  const exchangeRates = {
    USD: 1,
    EUR: 1.1,
    IDR: 0.00007
  }
  return amount * (exchangeRates[currency] || 1)
}

;(async () => {
  await creditRewardPoints(1)
  await deductRewardPoints(1, 50)
})()
