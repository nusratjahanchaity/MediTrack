const Prescription = require('../models/Prescription');
const fs = require('fs');
const path = require('path');

// @desc    Get all prescriptions for logged-in user
// @route   GET /api/prescriptions
// @access  Private
exports.getPrescriptions = async (req, res) => {
  try {
    console.log("getPrescriptions: fetching for user", req.user.uid);
    const prescriptions = await Prescription.find({ userId: req.user.uid }).sort({ createdAt: -1 });
    res.json(prescriptions);
  } catch (error) {
    console.error('Error fetching prescriptions:', error);
    res.status(500).json({ message: 'Server error retrieving prescriptions' });
  }
};

// @desc    Upload new prescription
// @route   POST /api/prescriptions
// @access  Private
exports.uploadPrescription = async (req, res) => {
  try {
    console.log("uploadPrescription: user", req.user.uid);
    if (!req.file) {
      console.log("uploadPrescription: no file in request");
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const { filename, originalname, mimetype, size } = req.file;
    console.log("uploadPrescription: file details:", { filename, originalname, mimetype, size });

    const prescription = new Prescription({
      userId: req.user.uid,
      filename,
      originalName: originalname,
      filePath: `uploads/${filename}`,
      mimeType: mimetype,
      size
    });

    const savedPrescription = await prescription.save();
    console.log("uploadPrescription: saved metadata to DB:", savedPrescription._id);
    res.status(201).json(savedPrescription);
  } catch (error) {
    console.error('Error saving prescription:', error);
    // Cleanup physical file if DB save failed
    if (req.file) {
      const filePath = path.join(__dirname, '..', 'uploads', req.file.filename);
      fs.unlink(filePath, (err) => {
        if (err) console.error('Error deleting file after DB failure:', err);
      });
    }
    res.status(500).json({ message: 'Server error saving prescription metadata' });
  }
};

// @desc    Delete prescription
// @route   DELETE /api/prescriptions/:id
// @access  Private
exports.deletePrescription = async (req, res) => {
  try {
    console.log("deletePrescription: deleting id", req.params.id, "for user", req.user.uid);
    const prescription = await Prescription.findOne({
      _id: req.params.id,
      userId: req.user.uid
    });

    if (!prescription) {
      console.log("deletePrescription: prescription not found in DB with id", req.params.id);
      return res.status(404).json({ message: 'Prescription not found' });
    }

    console.log("deletePrescription: found prescription document:", prescription._id, prescription.filename);

    // Delete the file from filesystem
    const filePath = path.join(__dirname, '..', 'uploads', prescription.filename);
    console.log("deletePrescription: physical file path:", filePath);
    
    fs.unlink(filePath, async (err) => {
      if (err) {
        console.error('deletePrescription: failed to delete physical file:', err.message);
        // We still proceed to delete from DB, in case file was deleted manually
      } else {
        console.log("deletePrescription: deleted physical file from disk");
      }

      await Prescription.deleteOne({ _id: prescription._id });
      console.log("deletePrescription: deleted metadata from DB");
      res.json({ message: 'Prescription deleted successfully' });
    });
  } catch (error) {
    console.error('Error deleting prescription:', error);
    res.status(500).json({ message: 'Server error deleting prescription' });
  }
};

// @desc    Extract medications from prescription using Gemini
// @route   POST /api/prescriptions/:id/extract
// @access  Private
exports.extractPrescription = async (req, res) => {
  try {
    const { id } = req.params;
    console.log("extractPrescription: extracting for id", id, "for user", req.user.uid);

    const prescription = await Prescription.findOne({
      _id: id,
      userId: req.user.uid
    });

    if (!prescription) {
      console.log("extractPrescription: prescription not found in DB with id", id);
      return res.status(404).json({ message: 'Prescription not found' });
    }

    // Return cached data if already extracted to avoid token burnout
    if (prescription.extracted) {
      console.log("extractPrescription: already extracted, returning cached data");
      return res.json(prescription);
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error("extractPrescription: GEMINI_API_KEY is not configured in environment");
      return res.status(500).json({ message: 'Gemini API Key is not configured on the server. Please check environment variables.' });
    }

    const absolutePath = path.join(__dirname, '..', 'uploads', prescription.filename);
    console.log("extractPrescription: reading physical file at path:", absolutePath);

    if (!fs.existsSync(absolutePath)) {
      console.error("extractPrescription: file not found on disk:", absolutePath);
      return res.status(404).json({ message: 'Prescription file not found on server disk.' });
    }

    const fileBuffer = await fs.promises.readFile(absolutePath);
    const base64Data = fileBuffer.toString('base64');
    const mimeType = prescription.mimeType;

    const prompt = `
Extract all medications from the uploaded prescription file.
For each medication, extract:
1. "name": The brand name or generic name of the medicine.
2. "dosage": The strength of the medicine (e.g. '500mg', '10mg', '1 tablet'). Ensure it is a string representing the strength/dosage.
3. "time": Determine when the medication should be taken (morning, afternoon, night).
   - If morning, make the time "07:00"
   - If afternoon, make the time "13:00"
   - If night, make the time "21:00"
   - If it is scheduled for multiple times (e.g., morning and night), create separate entries for each time. For example, if a medicine is taken morning and night, return one entry with "time": "07:00" and another entry with "time": "21:00".
4. "type": Determine the category of medication. Choose ONLY one of: "Tablet", "Syrup", "Injection". If not specified or clear, default to "Tablet".
5. "comment": Explain the meal instructions. Choose ONLY one of: "before meal", "after meal". If not mentioned in the prescription, default to "after meal".

Return the result as a JSON array of objects with the following schema:
[
  {
    "name": "string",
    "dosage": "string",
    "time": "string",
    "type": "string",
    "comment": "string"
  }
]
`;

    console.log("extractPrescription: sending request to Gemini API for file:", prescription.originalName);

    const modelCandidates = [
      'gemini-2.5-flash',
      'gemini-2.0-flash',
      'gemini-3.5-flash',
      'gemini-flash-latest'
    ];

    let lastError = null;
    let response = null;
    let responseData = null;
    let successfulModel = '';

    for (const model of modelCandidates) {
      try {
        console.log(`extractPrescription: attempting extraction using model: ${model}`);
        const apiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  { text: prompt },
                  {
                    inlineData: {
                      mimeType: mimeType,
                      data: base64Data
                    }
                  }
                ]
              }
            ],
            generationConfig: {
              responseMimeType: 'application/json'
            }
          })
        });

        if (apiResponse.ok) {
          response = apiResponse;
          responseData = await apiResponse.json();
          successfulModel = model;
          console.log(`extractPrescription: successfully extracted using model: ${model}`);
          break;
        } else {
          const errText = await apiResponse.text();
          console.warn(`extractPrescription: model ${model} failed with status ${apiResponse.status}: ${errText}`);
          lastError = `Model ${model} returned ${apiResponse.status}: ${errText}`;
        }
      } catch (err) {
        console.error(`extractPrescription: request failed for model ${model}:`, err.message);
        lastError = err.message;
      }
    }

    if (!response) {
      return res.status(500).json({ message: `All extraction attempts failed. Last error: ${lastError}` });
    }
    const textResult = responseData.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!textResult) {
      console.error("extractPrescription: Gemini API returned empty candidate text");
      return res.status(500).json({ message: 'Empty response content from Gemini API' });
    }

    console.log("extractPrescription: raw output text:", textResult);

    let parsedData;
    try {
      parsedData = JSON.parse(textResult.trim());
    } catch (e) {
      console.error("extractPrescription: failed to parse json:", textResult, e.message);
      return res.status(500).json({ message: 'Failed to parse Gemini response as JSON: ' + e.message });
    }

    let extractedMeds = [];
    if (Array.isArray(parsedData)) {
      extractedMeds = parsedData;
    } else if (parsedData && Array.isArray(parsedData.medications)) {
      extractedMeds = parsedData.medications;
    } else if (parsedData && typeof parsedData === 'object') {
      extractedMeds = [parsedData];
    }

    const validTypes = ['Tablet', 'Syrup', 'Injection'];
    const normalizedMeds = extractedMeds.map(med => {
      // normalize time
      let t = med.time || '07:00';
      const cleanTime = t.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (cleanTime.includes('morning') || cleanTime.includes('7am') || cleanTime.includes('0700')) {
        t = '07:00';
      } else if (cleanTime.includes('afternoon') || cleanTime.includes('1pm') || cleanTime.includes('1300')) {
        t = '13:00';
      } else if (cleanTime.includes('night') || cleanTime.includes('evening') || cleanTime.includes('9pm') || cleanTime.includes('2100')) {
        t = '21:00';
      } else {
        // map HH:MM formats
        const match = t.match(/(\d{1,2}):(\d{2})/);
        if (match) {
          const hour = parseInt(match[1]);
          if (hour < 12) {
            t = '07:00';
          } else if (hour >= 12 && hour < 17) {
            t = '13:00';
          } else {
            t = '21:00';
          }
        } else {
          t = '07:00'; // Default morning
        }
      }

      // normalize type
      let typ = med.type || 'Tablet';
      typ = typ.charAt(0).toUpperCase() + typ.slice(1).toLowerCase();
      if (!validTypes.includes(typ)) {
        typ = 'Tablet';
      }

      // normalize comment
      let comment = med.comment || 'after meal';
      comment = comment.toLowerCase();
      if (comment.includes('before')) {
        comment = 'before meal';
      } else {
        comment = 'after meal';
      }

      return {
        name: med.name || 'Unknown Medicine',
        dosage: med.dosage || '1 unit',
        time: t,
        type: typ,
        comment: comment
      };
    });

    // Save extracted data to the prescription in MongoDB
    prescription.extracted = true;
    prescription.extractedData = normalizedMeds;
    const updatedPrescription = await prescription.save();

    console.log("extractPrescription: extraction successful! Saved to DB:", updatedPrescription._id);
    res.json(updatedPrescription);

  } catch (error) {
    console.error('Error during prescription extraction:', error);
    res.status(500).json({ message: 'Server error during prescription extraction: ' + error.message });
  }
};

