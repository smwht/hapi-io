'use strict';

var _ = require('lodash');
var socketio = require('socket.io');
var auth = require('./auth');
var routes = require('./routes');

// Declare internals

var internals = {
	defaults: {
		socketio: {
			path: '/socket.io'
		}
	}
};

internals.register = function(label, server, options){
	var s = label ? server.select(label) : server;

	if (!s) {
		return 'hapi-io - no server';
	}

	if (!s.connections.length) {
		return 'hapi-io - no connection';
	}

	if (s.connections.length !== 1) {
		return 'hapi-io - multiple connections';
	}

	var connection = s && s.connections.length && s.connections[0];

	if (!connection) {
		return 'No connection/listener found';
	}

	var io = socketio(connection.listener, options.socketio);

	s.expose('io', io);

	if (options.auth) {
		auth(s, io, options);
	}

	io.on('connection', function(socket) {
		routes(s, socket);
	});
};

exports.register = function(server, options, next) {

	_.defaults(options, internals.defaults);
	
	var errs = [];

	var labels = _.isArray(options.connectionLabel ) ? options.connectionLabel : [ options.connectionLabel ];

	_.map(labels, function( label ){
		var err = internals.register(label, server, options);

		if(err){
			errs.push({
				label: label,
				error: err
			});
		}
	});

	next(errs.length && errs);
};

exports.register.attributes = {
	pkg: require('../package.json')
};
