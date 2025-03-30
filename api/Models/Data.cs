using System;
using System.Text;
using System.IO;
using Python.Runtime;
using System.Text.Json;
using System.Collections.Generic;

namespace api.Models
{
    public class Data
    {
       public int id { get; set; } // unique identifier
       public string? Name { get; set; } //patient name PID-5
       public string? Address { get; set; } //patient address PID-11
       public string? BirthYear { get; set; } //patient birthday PID-7
       public string[]? PhoneNumber { get; set; } //patient phone numbers PID-13, PID-14
       public int? SSN { get; set; } //patient SSN PID-19
       public int? MRN { get; set; } //patient MRN PID-3
       public string[]? MaybeAccountNos { get; set; } // in PID-18, PV1-19
       public string[]? Doctors { get; set; } //Doctor's names PV1-7, PV1-8, PV1-9, PV1-17, PV1-52
       public string[]? Notes { get; set; } //OBX-5
       public string? MsgControlID { get; set; } //MSH-10
    }
}