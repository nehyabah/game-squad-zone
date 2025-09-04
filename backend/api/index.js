module.exports = (req, res) => {
  res.status(200).json({ 
    message: "Backend is running!",
    path: req.url,
    method: req.method,
    timestamp: new Date().toISOString()
  });
};