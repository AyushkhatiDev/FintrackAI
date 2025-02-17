const crypto = require('crypto');

class Helpers {
  static generateRandomString(length = 32) {
    return crypto.randomBytes(length).toString('hex');
  }

  static formatCurrency(amount, currency = 'USD') {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  }

  static calculateDateDifference(date1, date2) {
    const diff = Math.abs(date1 - date2);
    return {
      days: Math.floor(diff / (1000 * 60 * 60 * 24)),
      hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
      minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    };
  }

  static isValidDate(date) {
    return date instanceof Date && !isNaN(date);
  }

  static sanitizeInput(input) {
    if (typeof input !== 'string') return input;
    return input.trim().replace(/[<>]/g, '');
  }

  static generatePaginationLinks(baseUrl, page, limit, total) {
    const totalPages = Math.ceil(total / limit);
    const links = {};

    if (page > 1) {
      links.prev = `${baseUrl}?page=${page - 1}&limit=${limit}`;
    }

    if (page < totalPages) {
      links.next = `${baseUrl}?page=${page + 1}&limit=${limit}`;
    }

    links.first = `${baseUrl}?page=1&limit=${limit}`;
    links.last = `${baseUrl}?page=${totalPages}&limit=${limit}`;

    return links;
  }

  static async retryOperation(operation, maxAttempts = 3, delay = 1000) {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        if (attempt === maxAttempts) throw error;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  static validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  static maskSensitiveData(data, fields = ['password', 'creditCard']) {
    const masked = { ...data };
    fields.forEach(field => {
      if (masked[field]) {
        masked[field] = '********';
      }
    });
    return masked;
  }
}

module.exports = Helpers;
