var express = require("express");
var server = express();
var bodyParser = require("body-parser");

var model = {
  clients: {},
  reset: function () {
    this.clients = {};
  },
  addAppointment(client, date) {
    if (this.clients.hasOwnProperty(client)) {
      this.clients[client].push({ ...date, status: "pending" });
    } else {
      this.clients = {
        ...this.clients,
        [client]: [{ ...date, status: "pending" }],
      };
    }
  },
  attend(name, date) {
    if (this.clients.hasOwnProperty(name)) {
      this.clients[name].forEach((e) => {
        if (e.date === date) {
          e.status = "attended";
        }
      });
    }
  },
  expire(name, date) {
    if (this.clients.hasOwnProperty(name)) {
      this.clients[name].forEach((e) => {
        if (e.date === date) {
          e.status = "expired";
        }
      });
    }
  },
  cancel(name, date) {
    if (this.clients.hasOwnProperty(name)) {
      this.clients[name].forEach((e) => {
        if (e.date === date) {
          e.status = "cancelled";
        }
      });
    }
  },
  erase(name, date) {
    if (date === "attended" || date === "cancelled" || date === "expired") {
      this.clients[name] = this.clients[name].filter((e) => e.status !== date);
    } else {
      if (this.clients.hasOwnProperty(name)) {
        this.clients[name] = this.clients[name].filter((e) => e.date !== date);
      }
    }
  },
  getAppointments(name, status) {
    if (this.clients.hasOwnProperty(name)) {
      if (status) {
        return this.clients[name].filter((e) => e.status === status);
      } else {
        return this.clients[name];
      }
    }
  },
  getClients() {
    return [...Object.keys(this.clients)];
  },
};

server.use(bodyParser.json());

server.get("/api", (req, res) => {
  res.json(model.clients);
});

server.post("/api/Appointments", (req, res) => {
  if (!req.body.client) {
    res.status(400).send("the body must have a client property");
  } else if (typeof req.body.client !== "string") {
    res.status(400).send("client must be a string");
  } else {
    model.addAppointment(req.body.client, req.body.appointment);
    res.json({ ...req.body.appointment, status: "pending" });
  }
});

server.get("/api/Appointments/:name", (req, res) => {
  if (!model.clients.hasOwnProperty(req.params.name)) {
    res.status(400).send("the client does not exist");
  } else {
    let hasAppointment = false;
    model.clients[req.params.name].forEach((e) => {
      if (e.date === req.query.date) {
        hasAppointment = true;
      }
    });
    if (!hasAppointment) {
      return res
        .status(400)
        .send("the client does not have a appointment for that date");
    } else {
      if (req.query.option === "attend") {
        model.attend(req.params.name, req.query.date);
        const lastValue = model.clients[req.params.name].find(
          (e) => e.date === req.query.date && e.status === "attended"
        );
        res.send(lastValue);
      } else if (req.query.option === "expire") {
        model.expire(req.params.name, req.query.date);
        const lastValue = model.clients[req.params.name].find(
          (e) => e.date === req.query.date && e.status === "expired"
        );
        res.send(lastValue);
      } else if (req.query.option === "cancel") {
        model.cancel(req.params.name, req.query.date);
        const lastValue = model.clients[req.params.name].find(
          (e) => e.date === req.query.date && e.status === "cancelled"
        );
        res.send(lastValue);
      } else {
        res.status(400).send("the option must be attend, expire or cancel");
      }
    }
  }
});

server.get("/api/Appointments/:name/erase", (req, res) => {
  if (model.clients.hasOwnProperty(req.params.name)) {
    if (req.query.date) {
      model.erase(req.params.name, req.query.date);
      const newArr = model.clients[req.params.name];
      res.send(newArr);
    }
  } else {
    res.status(400).send("the client does not exist");
  }
});

server.get("/api/Appointments/clients", (req, res) => {
  const clients = model.getClients();
  res.send(clients);
});

module.exports = { model, server };
