import express from "express";

export const router = express.Router();
export const prefix = '/';


/**
 * Hello world for the root
 */
router.get('/', function (req, res) {
  res.render('index.pug')
});