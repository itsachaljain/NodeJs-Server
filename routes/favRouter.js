const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const authenticate = require("../authenticate");
const cors = require("./cors");

const Favorites = require("../models/favorite");
const Dishes = require("../models/dishes");

const favRouter = express.Router();

favRouter.use(bodyParser.json());

favRouter
	.route("/")
	.options(cors.corsWithOptions, (res, req) => {
		res.sendStatus(200);
	})
	.get(cors.cors, authenticate.verifyUser, (req, res, next) => {
		Favorites.findOne({ user: req.user._id }, (err, favorite) => {
			if (err) {
				return next(err);
			}
			if (!favorite) {
				res.statusCode = 403;
				res.end("No favorites found!!");
			}
		})
			.populate("user")
			.populate("dishes")
			.then(
				(favorites) => {
					res.statusCode = 200;
					res.setHeader("Content-Type", "application/json");
					res.json(favorites);
				},
				(err) => next(err)
			);
	})
	.post(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
		Favorites.findOne({ user: req.user._id }).then((favorite) => {
			if (favorite == null) {
				Favorites.create().then((favorite) => {
					res.statusCode = 200;
					res.setHeader("Content-Type", "application/json");
					for (const i in req.body) {
						favorite.dishes.push(req.body[i]);
					}
					favorite
						.save()
						.then((favorite) => {
							Favorites.findById(favorite._id)
								.populate("user")
								.populate("dishes")
								.then((favorite) => {
									res.statusCode = 200;
									res.setHeader("Content-Type", "application/json");
									res.json(favorite);
								});
						})
						.catch((err) => {
							return next(err);
						});
				});
			} else {
				for (i = 0; i < req.body.length; i++)
					if (favorite.dishes.indexOf(req.body[i]._id) < 0)
						favorite.dishes.push(req.body[i]);
				favorite
					.save()
					.then((favorite) => {
						Favorites.findById(favorite._id)
							.populate("user")
							.populate("dishes")
							.then((favorite) => {
								res.statusCode = 200;
								res.setHeader("Content-Type", "application/json");
								res.json(favorite);
							});
					})
					.catch((err) => {
						return next(err);
					});
			}
		});
	})
	.put(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
		res.statusCode = 403;
		res.end("PUT operation not supported on /favorites");
	})
	.delete(
		cors.corsWithOptions,
		authenticate.verifyUser,

		(req, res, next) => {
			Favorites.remove({})
				.then(
					(resp) => {
						res.statusCode = 200;
						res.setHeader("Content-Type", "application/json");
						res.json(resp);
					},
					(err) => next(err)
				)
				.catch((err) => next(err));
		}
	);

favRouter
	.route("/:dishId")
	.options(cors.corsWithOptions, (res, req) => {
		res.sendStatus(200);
	})

	.get(cors.cors, authenticate.verifyUser, (req, res, next) => {
		Favorites.findOne({ user: req.user._id })
			.then(
				(favorites) => {
					if (!favorites) {
						res.statusCode = 200;
						res.setHeader("Content-Type", "application/json");
						return res.json({ exists: false, favorites: favorites });
					} else {
						if (favorites.dishes.indexOf(req.params.dishId) < 0) {
							res.statusCode = 200;
							res.setHeader("Content-Type", "application/json");
							return res.json({ exists: false, favorites: favorites });
						} else {
							res.statusCode = 200;
							res.setHeader("Content-Type", "application/json");
							return res.json({ exists: true, favorites: favorites });
						}
					}
				},
				(err) => next(err)
			)
			.catch((err) => next(err));
	})

	.post(
		cors.corsWithOptions,
		authenticate.verifyUser,

		(req, res, next) => {
			Favorites.findOne({ user: req.user._id }, (err, favorite) => {
				if (err) {
					return next(err);
				}
				if (!favorite) {
					Favorites.create({ user: req.user._id }).then((favorite) => {
						favorite.dishes.push({ _id: req.params.dishId });
						favorite
							.save()
							.then((favorite) => {
								Favorites.findById(favorite._id)
									.populate("user")
									.populate("dishes")
									.then((favorite) => {
										res.statusCode = 200;
										res.setHeader("Content-Type", "application/json");
										res.json(favorite);
									});
							})
							.catch((err) => {
								return next(err);
							});
					});
				} else {
					if (favorite.dishes.indexOf(req.params.dishId) < 0) {
						favorite.dishes.push(req.body);
						favorite
							.save()
							.then((favorite) => {
								Favorites.findById(favorite._id)
									.populate("user")
									.populate("dishes")
									.then((favorite) => {
										res.statusCode = 200;
										res.setHeader("Content-Type", "application/json");
										res.json(favorite);
									});
							})
							.catch((err) => {
								return next(err);
							});
					} else {
						res.statusCode = 200;
						res.end("Favorite already added!!");
					}
				}
			});
		}
	)
	.put(
		cors.corsWithOptions,
		authenticate.verifyUser,

		(req, res, next) => {
			Favorites.findByIdAndUpdate(
				req.params.favoriteId,
				{
					$set: req.body,
				},
				{ new: true }
			)
				.then(
					(favorite) => {
						res.statusCode = 200;
						res.setHeader("Content-Type", "application/json");
						res.json(favorite);
					},
					(err) => next(err)
				)
				.catch((err) => next(err));
		}
	)
	.delete(
		cors.corsWithOptions,
		authenticate.verifyUser,

		(req, res, next) => {
			Favorites.findOne({ user: req.user._id })
				.then((favorite) => {
					favorite.dishes.remove(req.params.favoriteId);
					favorite.save().then((favorite) => {
						Favorites.findById(favorite._id)
							.populate("user")
							.populate("dishes")
							.then((favorite) => {
								res.statusCode = 200;
								res.setHeader("Content-Type", "application/json");
								res.json(favorite);
							});
					});
				})
				.catch((err) => next(err));
		}
	);

module.exports = favRouter;
