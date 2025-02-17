const { getIO } = require('./websocket');
const { redisClient } = require('../config/redis');

class NotificationService {
  static async sendNotification(userId, notification) {
    try {
      // Save notification to Redis
      const notifications = await this.getUserNotifications(userId);
      notifications.unshift({
        ...notification,
        id: Date.now(),
        timestamp: new Date(),
        read: false
      });

      // Keep only last 50 notifications
      if (notifications.length > 50) {
        notifications.pop();
      }

      await redisClient.set(
        `notifications:${userId}`,
        JSON.stringify(notifications)
      );

      // Send real-time notification via WebSocket
      const io = getIO();
      io.to(userId.toString()).emit('notification', notification);

    } catch (error) {
      console.error('Error sending notification:', error);
    }
  }

  static async getUserNotifications(userId) {
    try {
      const notifications = await redisClient.get(`notifications:${userId}`);
      return notifications ? JSON.parse(notifications) : [];
    } catch (error) {
      console.error('Error getting notifications:', error);
      return [];
    }
  }

  static async markNotificationAsRead(userId, notificationId) {
    try {
      const notifications = await this.getUserNotifications(userId);
      const updatedNotifications = notifications.map(notif => {
        if (notif.id === notificationId) {
          return { ...notif, read: true };
        }
        return notif;
      });

      await redisClient.set(
        `notifications:${userId}`,
        JSON.stringify(updatedNotifications)
      );

      return true;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return false;
    }
  }

  static async sendBudgetAlert(userId, budget, percentageUsed) {
    const notification = {
      type: 'BUDGET_ALERT',
      title: 'Budget Alert',
      message: `You've used ${percentageUsed.toFixed(1)}% of your ${budget.category.name} budget`,
      severity: percentageUsed > 90 ? 'high' : 'medium',
      data: {
        budgetId: budget._id,
        category: budget.category.name,
        percentageUsed
      }
    };

    await this.sendNotification(userId, notification);
  }

  static async sendRecurringPaymentReminder(userId, transaction) {
    const notification = {
      type: 'PAYMENT_REMINDER',
      title: 'Upcoming Payment',
      message: `Reminder: ${transaction.description} payment of ${transaction.amount} due soon`,
      severity: 'low',
      data: {
        transactionId: transaction._id,
        amount: transaction.amount,
        dueDate: transaction.nextDueDate
      }
    };

    await this.sendNotification(userId, notification);
  }

  static async sendSavingsGoalUpdate(userId, goal, progress) {
    const notification = {
      type: 'SAVINGS_GOAL',
      title: 'Savings Goal Update',
      message: `You're ${progress}% of the way to your ${goal.name} savings goal!`,
      severity: 'info',
      data: {
        goalId: goal._id,
        progress
      }
    };

    await this.sendNotification(userId, notification);
  }

  static async sendUnusualActivityAlert(userId, transaction) {
    const notification = {
      type: 'UNUSUAL_ACTIVITY',
      title: 'Unusual Activity Detected',
      message: `We noticed an unusual transaction: ${transaction.description} for ${transaction.amount}`,
      severity: 'high',
      data: {
        transactionId: transaction._id,
        amount: transaction.amount,
        category: transaction.category
      }
    };

    await this.sendNotification(userId, notification);
  }
}

module.exports = NotificationService; 