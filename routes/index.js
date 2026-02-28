var express = require('express')
var router = express.Router()

router.get('/healthOK', (req, res) => {
  res.status(200).json({ status: 'OK', uptime: process.uptime() })
})

module.exports = router
