// UC Create Service — Manager adds a new service (route /services/new).
import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { imageFileToUpload } from "../../../utils/imageUpload";
import {
  initialServiceFormData,
  buildServicePayload,
  getRequestErrorMessage,
  ServiceAdminHeader,
  ServiceFormFields,
  ServiceFormActions,
  ServiceGuidance,
} from "./serviceFormShared";

const CreateServiceForm = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState(initialServiceFormData);
  const [technicians, setTechnicians] = useState([]);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [imageUpload, setImageUpload] = useState(null);
  const [imageError, setImageError] = useState("");

  // Technicians that can be marked as qualified for the new service (0 = no service yet)
  useEffect(() => {
    axios
      .get("/api/service?technicians=0")
      .then((response) => {
        const rows = Array.isArray(response.data) ? response.data : [];
        setTechnicians(rows);
        setFormData((current) => ({
          ...current,
          technicianIds: rows.filter((t) => Number(t.qualified) === 1).map((t) => t.staffId),
        }));
      })
      .catch(() => setTechnicians([]));
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
    setSaveError("");
  };

  const toggleTechnician = (staffId) =>
    setFormData((current) => ({
      ...current,
      technicianIds: current.technicianIds.includes(staffId)
        ? current.technicianIds.filter((x) => x !== staffId)
        : [...current.technicianIds, staffId],
    }));

  const handleImageChange = async (event) => {
    const file = event.target.files?.[0];
    setImageError("");
    if (!file) return;
    try {
      setImageUpload(await imageFileToUpload(file));
    } catch (error) {
      setImageUpload(null);
      setImageError(error.message || "Could not process the image.");
      event.target.value = "";
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (saving) return;
    setSaving(true);
    setSaveError("");

    try {
      const response = await axios.post("/api/service", buildServicePayload(formData));
      const serviceId = response.data?.serviceId;

      let imageNotice = "";
      if (serviceId && imageUpload) {
        try {
          await axios.post(`/api/service-image/${serviceId}`, imageUpload);
        } catch (imageErr) {
          imageNotice = ` But the image could not be saved: ${getRequestErrorMessage(imageErr, "image upload error")}.`;
        }
      }

      navigate("/services", {
        replace: true,
        state: { serviceNotice: "New service added." + imageNotice },
      });
    } catch (error) {
      console.error("Error creating service:", error);
      setSaveError(
        getRequestErrorMessage(error, "Could not save the service. Please check the information and try again."),
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="service-admin-page">
      <ServiceAdminHeader
        title="Add new service"
        description="Add a new service to the catalog so customers can learn about it and book it."
      />

      <div className="service-admin-content">
        <section className="service-admin-form-card">
          <div className="service-admin-card-heading">
            <span className="service-admin-card-icon">
              <i className="bi bi-plus-lg" aria-hidden="true" />
            </span>
            <div>
              <h2>Service information</h2>
              <p>Fields marked * are required.</p>
            </div>
          </div>

          {saveError && <div className="alert alert-danger" role="alert">{saveError}</div>}

          <form onSubmit={handleSubmit}>
            <ServiceFormFields
              formData={formData}
              onChange={handleChange}
              saving={saving}
              technicians={technicians}
              onToggleTechnician={toggleTechnician}
              imageUpload={imageUpload}
              imageError={imageError}
              onImageChange={handleImageChange}
            />
            <ServiceFormActions saving={saving} submitLabel="Add service" submitIcon="bi-plus-lg" />
          </form>
        </section>

        <ServiceGuidance />
      </div>
    </main>
  );
};

export default CreateServiceForm;
