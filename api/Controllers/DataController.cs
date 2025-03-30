using System;
using System.IO;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Http;
using api.Models;
using System.Linq;
using System.Text.RegularExpressions;

namespace api.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class DataController : ControllerBase
    {
        private static int nextId = 1;
    
    [HttpGet("default")]
    public IActionResult GetNormalFile()
{
    string filePath = "../source_hl7_messages_v2.hl7.txt";

    if (!System.IO.File.Exists(filePath))
    {
        return NotFound("File not found.");
    }

    try
    {
        string fileContents = System.IO.File.ReadAllText(filePath).Replace("\r\n", "\r").Replace("\n", "\r");

        // Split by "MSH", making sure to process all entries till the end of file
        List<string> messages = new List<string>();

        string pattern = @"(?=MSH|EVN|PID|PV1|OBR|ORC)";

        string[] rawMessages = Regex.Split(fileContents, pattern);

        foreach (string msg in rawMessages)
        {
            string cleanedMessage = msg.Trim();

            // Ensure "MSH" is re-added properly
            if (!string.IsNullOrEmpty(cleanedMessage))
            {
                messages.Add(cleanedMessage);
            }
        }

        return Ok(messages);
        
    }
    catch (Exception ex)
    {
        return StatusCode(500, "Error reading file: " + ex.Message);
    }
}

[HttpGet("deID")]
    public IActionResult GetDeIDFile()
{
    string filePath = "../messages_deidentified.txt";

    if (!System.IO.File.Exists(filePath))
    {
        return NotFound("File not found.");
    }

    try
    {
        string fileContents = System.IO.File.ReadAllText(filePath).Replace("\r\n", "\r").Replace("\n", "\r");

        // Split by "MSH", making sure to process all entries till the end of file
        List<string> messages = new List<string>();

        string pattern = @"(?=MSH|EVN|PID|PV1|OBR|ORC)";

        string[] rawMessages = Regex.Split(fileContents, pattern);

        foreach (string msg in rawMessages)
        {
            string cleanedMessage = msg.Trim();

            // Ensure "MSH" is re-added properly
            if (!string.IsNullOrEmpty(cleanedMessage))
            {
                messages.Add(cleanedMessage);
            }
        }

        return Ok(messages);
        
    }
    catch (Exception ex)
    {
        return StatusCode(500, "Error reading file: " + ex.Message);
    }
}

    /*public IActionResult GetNormalFile(){
        string filePath = "../source_hl7_messages_v2.hl7.txt";
        StreamReader reader = new StreamReader(filePath);
        string line;
                while ((line = reader.ReadLine()) != null){
                    string contents = reader.ReadToEnd();
                    return Ok(contents);
                }
                return BadRequest("blah");
        
    }*/

    [HttpGet("pls")]
    public IActionResult ProcessStaticHL7File()
    {
        try
        {
            // Get file path from configuration
            string filePath = "../source_hl7_messages_v2.hl7.txt";
            
            if (!System.IO.File.Exists(filePath))
            {
                return NotFound($"HL7 file not found at: {filePath}");
            }
            
            List<Data> patients = new List<Data>();
            Data currentPatient = null;
            List<string> notes = new List<string>();
            List<string> doctors = new List<string>();
            List<string> accountNos = new List<string>();
            List<string> phoneNumbers = new List<string>();
            
            // Read the static file
            using (StreamReader reader = new StreamReader(filePath))
            {
                string line;
                while ((line = reader.ReadLine()) != null)
                {
                    string[] fields = line.Split('|');
                    
                    // Parse MSH segment (message header)
                    if (line.StartsWith("MSH"))
                    {
                        // Start a new patient
                        if (currentPatient != null)
                        {
                            // Assign collected values to arrays
                            currentPatient.Notes = notes.Count > 0 ? notes.ToArray() : null;
                            currentPatient.Doctors = doctors.Count > 0 ? doctors.ToArray() : null;
                            currentPatient.MaybeAccountNos = accountNos.Count > 0 ? accountNos.ToArray() : null;
                            currentPatient.PhoneNumber = phoneNumbers.Count > 0 ? phoneNumbers.ToArray() : null;
                            
                            patients.Add(currentPatient);
                        }
                        
                        currentPatient = new Data { id = nextId++ };
                        
                        // Clear lists for the new patient
                        notes = new List<string>();
                        doctors = new List<string>();
                        accountNos = new List<string>();
                        phoneNumbers = new List<string>();
                        
                        // Get message control ID (MSH-10)
                        if (fields.Length > 10)
                        {
                            currentPatient.MsgControlID = fields[10];
                        }
                    }
                    // Parse PID segment (patient information)
                    else if (line.StartsWith("PID") && currentPatient != null)
                    {
                        // MRN (PID-3)
                        if (fields.Length > 3 && !string.IsNullOrEmpty(fields[3]))
                        {
                            string mrnStr = fields[3].Split('^')[0];
                            if (int.TryParse(mrnStr, out int mrn))
                            {
                                currentPatient.MRN = mrn;
                            }
                        }
                        
                        // Name (PID-5)
                        if (fields.Length > 5 && !string.IsNullOrEmpty(fields[5]))
                        {
                            string[] nameComponents = fields[5].Split('^');
                            if (nameComponents.Length >= 2)
                            {
                                currentPatient.Name = $"{nameComponents[1]} {nameComponents[0]}";
                            }
                            else
                            {
                                currentPatient.Name = fields[5];
                            }
                        }
                        
                        // Birth Year (PID-7)
                        if (fields.Length > 7 && !string.IsNullOrEmpty(fields[7]))
                        {
                            currentPatient.BirthYear = fields[7];
                        }
                        
                        // Address (PID-11)
                        if (fields.Length > 11 && !string.IsNullOrEmpty(fields[11]))
                        {
                            string[] addressComponents = fields[11].Split('^');
                            currentPatient.Address = string.Join(", ", addressComponents.Where(a => !string.IsNullOrEmpty(a)));
                        }
                        
                        // Phone Numbers (PID-13, PID-14)
                        if (fields.Length > 13 && !string.IsNullOrEmpty(fields[13]))
                        {
                            phoneNumbers.Add(fields[13]);
                        }
                        
                        if (fields.Length > 14 && !string.IsNullOrEmpty(fields[14]))
                        {
                            phoneNumbers.Add(fields[14]);
                        }
                        
                        // Account Number (PID-18)
                        if (fields.Length > 18 && !string.IsNullOrEmpty(fields[18]))
                        {
                            accountNos.Add(fields[18]);
                        }
                        
                        // SSN (PID-19)
                        if (fields.Length > 19 && !string.IsNullOrEmpty(fields[19]))
                        {
                            if (int.TryParse(fields[19], out int ssn))
                            {
                                currentPatient.SSN = ssn;
                            }
                        }
                    }
                    // Parse PV1 segment (visit information)
                    else if (line.StartsWith("PV1") && currentPatient != null)
                    {
                        // Doctor names (PV1-7, PV1-8, PV1-9, PV1-17, PV1-52)
                        int[] doctorFieldIndices = { 7, 8, 9, 17, 52 };
                        foreach (int index in doctorFieldIndices)
                        {
                            if (fields.Length > index && !string.IsNullOrEmpty(fields[index]))
                            {
                                string[] docComponents = fields[index].Split('^');
                                if (docComponents.Length >= 2)
                                {
                                    doctors.Add($"{docComponents[1]} {docComponents[0]}");
                                }
                                else
                                {
                                    doctors.Add(fields[index]);
                                }
                            }
                        }
                        
                        // Account Number (PV1-19)
                        if (fields.Length > 19 && !string.IsNullOrEmpty(fields[19]))
                        {
                            accountNos.Add(fields[19]);
                        }
                    }
                    // Parse OBX segment (observation information)
                    else if (line.StartsWith("OBX") && currentPatient != null)
                    {
                        // Notes (OBX-5)
                        if (fields.Length > 5 && !string.IsNullOrEmpty(fields[5]))
                        {
                            notes.Add(fields[5]);
                        }
                    }
                }
                
                // Add the last patient
                if (currentPatient != null)
                {
                    // Assign collected values to arrays
                    currentPatient.Notes = notes.Count > 0 ? notes.ToArray() : null;
                    currentPatient.Doctors = doctors.Count > 0 ? doctors.ToArray() : null;
                    currentPatient.MaybeAccountNos = accountNos.Count > 0 ? accountNos.ToArray() : null;
                    currentPatient.PhoneNumber = phoneNumbers.Count > 0 ? phoneNumbers.ToArray() : null;
                    
                    patients.Add(currentPatient);
                }
            }
            return Ok(patients);
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"Internal server error: {ex.Message}");
        }
    }
}
}