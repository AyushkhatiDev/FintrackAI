const ReportService = require('../services/reportService');

// @desc    Get monthly report
// @route   GET /api/reports/monthly/:year/:month
// @access  Private
exports.getMonthlyReport = async (req, res) => {
  try {
    const { year, month } = req.params;
    const report = await ReportService.generateMonthlyReport(
      req.user._id,
      parseInt(month),
      parseInt(year)
    );

    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error generating monthly report',
      error: error.message
    });
  }
};

// @desc    Get annual report
// @route   GET /api/reports/annual/:year
// @access  Private
exports.getAnnualReport = async (req, res) => {
  try {
    const { year } = req.params;
    const report = await ReportService.generateAnnualReport(
      req.user._id,
      parseInt(year)
    );

    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error generating annual report',
      error: error.message
    });
  }
}; 