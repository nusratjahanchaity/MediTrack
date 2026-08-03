const Medicine = require('../models/Medicine');
const User = require('../models/User');
const Notification = require('../models/Notification');
const Alert = require('../models/Alert');

/**
 * Checks if a scheduled time string (e.g., "07:00") matches the current clock time with a given offset in minutes.
 * Handles hour rollover correctly.
 */
const isTimeMatch = (scheduledTimeStr, offsetMinutes) => {
  if (!scheduledTimeStr) return false;
  const parts = scheduledTimeStr.split(':');
  if (parts.length < 2) return false;

  const scheduledHours = parseInt(parts[0], 10);
  const scheduledMinutes = parseInt(parts[1], 10);
  if (isNaN(scheduledHours) || isNaN(scheduledMinutes)) return false;
  
  const now = new Date();
  const scheduledDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), scheduledHours, scheduledMinutes, 0, 0);
  const targetDate = new Date(scheduledDate.getTime() + offsetMinutes * 60 * 1000);
  
  return now.getHours() === targetDate.getHours() && now.getMinutes() === targetDate.getMinutes();
};

let lastCheckedMinute = "";

const checkMedicinesSchedule = async () => {
  const now = new Date();
  const minuteKey = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()} ${now.getHours()}:${now.getMinutes()}`;
  
  if (minuteKey === lastCheckedMinute) {
    return;
  }
  lastCheckedMinute = minuteKey;

  try {
    const medicines = await Medicine.find();

    for (const med of medicines) {
      // 1. Regular Dose Reminder (offset = 0)
      if (isTimeMatch(med.time, 0)) {
        const message = `Reminder: It is time to take your medication "${med.name}" (${med.dosage}) - ${med.comment || 'no special instructions'}`;
        
        // Prevent duplicate notification for same minute/medicine
        const existing = await Notification.findOne({
          userId: med.userId,
          medicineId: med._id,
          type: 'reminder',
          createdAt: { $gte: new Date(now.getTime() - 60000) }
        });

        if (!existing) {
          const notification = new Notification({
            userId: med.userId,
            medicineId: med._id,
            type: 'reminder',
            message
          });
          await notification.save();
          console.log(`[Scheduler] Reminder sent to user ${med.userId} for ${med.name}`);
        }
      }

      // 2. Missed Dose Warning & Caregiver Alert (offset = 15)
      if (isTimeMatch(med.time, 15)) {
        const currentMed = await Medicine.findById(med._id);
        if (currentMed && !currentMed.taken) {
          // Warning notification to patient
          const userMessage = `Urgent: You missed taking your medication "${currentMed.name}" scheduled at ${currentMed.time}!`;
          const patientNotif = new Notification({
            userId: currentMed.userId,
            medicineId: currentMed._id,
            type: 'warning',
            message: userMessage
          });
          await patientNotif.save();

          // Fetch patient email
          const patientUser = await User.findOne({ uid: currentMed.userId });
          const patientEmail = patientUser ? patientUser.email : 'Unknown Patient';

          // Alert for caregiver/admin
          const alertMessage = `Alert: Patient ${patientEmail} has not taken their medication "${currentMed.name}" (Scheduled: ${currentMed.time})`;
          
          const alert = new Alert({
            userId: currentMed.userId,
            medicineId: currentMed._id,
            message: alertMessage
          });
          await alert.save();
          console.log(`[Scheduler] Alert generated for missed medication ${currentMed.name} by ${patientEmail}`);
        }
      }
    }
  } catch (error) {
    console.error('[Scheduler Error]:', error.message);
  }
};

// Check every 10 seconds to catch all clock minutes reliably without drift issues
setInterval(checkMedicinesSchedule, 10000);
console.log('Background medicine scheduler active.');
