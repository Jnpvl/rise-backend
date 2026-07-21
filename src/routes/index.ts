import { Router } from "express";
import staffRoute from "./staff.routes";
import generalInformationRoute from "./generalInformation.routes";
import patientRoute from "./patient.routes";
import consultationsRoute from "./consultations.routes";
import appointmentRoute from "./appointment.routes";
import dashboardRoute from "./dashboard.routes";
import uploadRoute from "./upload.routes";
import clinicSettingsRoute from "./clinicSettings.routes";
import webInquiryRoute from "./webInquiry.routes";
import labResultRoute from "./labResult.routes";

const v1Router = Router();

v1Router.use("/staff", staffRoute);
v1Router.use("/generalInformation", generalInformationRoute);
v1Router.use("/patients", patientRoute);
v1Router.use("/consultations", consultationsRoute);
v1Router.use("/appointments", appointmentRoute);
v1Router.use("/dashboard", dashboardRoute);
v1Router.use("/uploads", uploadRoute);
v1Router.use("/clinic-settings", clinicSettingsRoute);
v1Router.use("/web-inquiries", webInquiryRoute);
v1Router.use("/lab-results", labResultRoute);

export default v1Router;
