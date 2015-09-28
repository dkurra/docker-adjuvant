var Order = require('./models/order');
var beverageHandler = require("./handlers/beverage");
var Users = require('./models/users');
var rmdir = require('rimraf');
var multer  = require('multer');
var upload = multer({ dest: 'uploads/' });
var xlsxj = require('xlsx-to-json');
var xlsx = require('xlsx');
var root = require('root-path');
var moment = require('moment');

module.exports = function(app) {

	app.post('/api/beverages/', beverageHandler.create);
	app.put('/api/beverages/:id', beverageHandler.update);
	app.get('/api/beverages/', beverageHandler.findAll);
	app.get('/api/beverages/:id', beverageHandler.findById);
	app.delete('/api/beverages/:id', beverageHandler.delete);

	app.post('/api/createUsers', upload.single('users'), function(req, res) {
	    Users.remove({}, function(err) {
	        if(err) return console.error(err);
	    });

	    var excelFilePath = root( req.file.path);
	    var resourcePath = root('admin', 'resources');
	    var workbook = xlsx.readFile(excelFilePath);

        workbook.SheetNames.forEach(function(sheetName, index) {
            xlsxj({
                    input: excelFilePath,
                    output: null,
                    sheet: sheetName
                  }, function(err, result) {
                    if(err) {
                      console.error(err);
                    }
                    Users.collection.insert(result, function(err, data) {
                        if(err) return console.error(err);
                    });

                  });
        });

        rmdir(root('admin', 'uploads'), function(err) {
            if(err) return console.error(err);
        });

        res.redirect('/#/manageUsers');

	});

	app.get('/api/users/', function(req, res) {
	    Users.find().exec(function(err, users) {
            if(err) {
                console.log("Error in reading users");
                return;
            }
            res.json(users == null ? 404 : users);
        });
	});

	app.get('/api/users/empId/:empId', function(req, res) {
        Users.findOne({EmpId: req.params.empId}).exec(function (err, user) {
            res.send(user == null ? 404 : user);
        });
    });

    app.get('/api/users/internalNumber/:internalNumber', function(req, res) {
        Users.findOne({InternalNumber: req.params.internalNumber}).exec(function (err, user) {
            res.send(user == null ? 404 : user);
        });
    });

	app.delete('/api/users/:empId/', function(req, res) {
    		Users.findOneAndRemove({EmpId: req.params.empId}).exec(function (err, user) {
            res.send(user == null ? 404 : "");
    		});
    	});

    app.post('/api/users/', function(req, res) {
        var user = new Users(req.body)

        user.save(function(err) {
            if(err)
                res.send(err);
        });
        res.json(user);
    });

    app.put('/api/users/:empId/', function(req, res) {

  		Users.findOneAndUpdate({EmpId: req.params.empId}, req.body).exec(function(err, user) {
  			if(err) {
  				console.log("Error in updating user", err);
  				return;
  			}
            res.send(user == null ? 404 : user);
  		});
  	});

	app.post('/api/addUser', function(req, res) {

	  console.log("req.body", req.body)
	  return Users.create(req.body, function(err, data) {
                                     if(err) return res.send(err);
                                     res.json(req.body)
      });
    })

    app.post('/api/deleteUser', function(req, res) {
      console.log("re", req.body.EmpId)
	  return Users.remove({"EmpId": req.body.EmpId }, function(err, data) {
                        if(err) return res.send(err);
                        res.json(req.body)
      });
    })

	app.post('/api/orders', function(req, res) {
		  var allDrinksRequest = [];
		  var eachDrinkRequest;

		  req.body.drinks.forEach(function(drink) {
		  	eachDrinkRequest = {
            		  	Date: new Date(),
            		  	EmployeeId: req.body.employeeId,
            		  	DrinkName: drink.name,
            		  	Quantity: drink.quantity,
            		  	expiresAt: moment(moment(new Date())+moment.duration(6, 'months'))
            };
            allDrinksRequest.push(eachDrinkRequest);
		  })

		  return Order.create(allDrinksRequest, function(error) {
						if(error)
						  res.send(error);
						res.json({"orderStatus": "success"});
          });
	})

	app.put('/api/findOrdersForSingleDay', function(req, res) {
    	  return Order.find({"Date" : new Date(req.body.Date)}).exec(function(error, orders) {
    	                if(error)
    	                    res.send(error);
						res.json(orders);
    	  })
	})

	app.put('/api/findOrdersForSelectPeriod', function(req, res) {
    	  return Order.find({"Date" : {$gte: new Date(req.body.startDate), $lt: new Date(req.body.endDate)}})
    	                    .exec(function(error, orders) {
    	                if(error)
    	                    res.send(error);
						res.json(orders);
    	  })
	})

};

