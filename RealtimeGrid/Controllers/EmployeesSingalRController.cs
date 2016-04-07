﻿using System;
using System.Collections.Generic;
using System.Data;
using System.Data.Entity;
using System.Data.Entity.Infrastructure;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Web;
using System.Web.Http;
using RealtimeGrid.Models;
using System.Web.Http.OData;
using RealtimeGrid.Hubs;

namespace RealtimeGrid.Controllers
{
    public class EmployeesSignalRController : EntitySetWithControllerHub<EmployeeHub>
    {
        private RealtimeGridContext db = new RealtimeGridContext();

        public override IQueryable<Employee> Get()
        {
            return db.Employees;
        }

        protected override Employee GetEntityByKey(int key)
        {
            return db.Employees.Find(key);
        }

        protected override Employee PatchEntity(int key, Delta<Employee> patch)
        {
            var employeeToPatch = GetEntityByKey(key);
            patch.Patch(employeeToPatch);
            db.Entry(employeeToPatch).State = EntityState.Modified;
            db.SaveChanges();

            var changedProperty = patch.GetChangedPropertyNames().ToList()[0];
            object changedPropertyValue;
            patch.TryGetPropertyValue(changedProperty, out changedPropertyValue);

            // note 'updateEmployee' is a function that will be called from the client
            Hub.Clients.All.updateEmployee(employeeToPatch.Id, changedProperty, changedPropertyValue);
            return employeeToPatch;
        }

        protected override void Dispose(bool disposing)
        {
            db.Dispose();
            base.Dispose(disposing);
        }
    }
}