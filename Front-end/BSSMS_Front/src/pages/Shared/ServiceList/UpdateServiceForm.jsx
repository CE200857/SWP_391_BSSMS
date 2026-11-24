// UC Update Service — Manager edits an existing service (route /services/edit/:id).
import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import { imageFileToUpload } from "../../../utils/imageUpload";
import {
  initialServiceFormData,
  buildServicePayload,
  getRequestErrorMessage,
  ServiceAdminHeader,
  ServiceLoadState,
  ServiceFormFields,
  ServiceFormActions,
  ServiceGuidance,
} from "./serviceFormShared";

const UpdateServiceForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState(initialServiceFormData);
  const [technicians, setTechnicians] = useState([]);
  const [loadError, setLoadError] = useState("");
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [loadedRequestKey, setLoadedRequestKey] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [imageUpload, setImageUpload] = useState(null);
  const [removeImage, setRemoveImage] = useState(false);
  const [imageError, setImageError] = useState("");
  const requestKey = `${id}:${loadAttempt}`;
  const loading = loadedRequestKey !== requestKey;

  // Load the service being edited
  useEffect(() => {
    let cancelled = false;
    axios
      .get(`/api/service?id=${id}`)
      .then((response) => {
        if (cancelled) return;
        const service = response.data;
        setLoadError("");
        setImageUrl(service.imageUrl || "");
        setFormData((current) => ({
          ...current,
          serviceName: service.serviceName || "",
          description: service.description || "",
          price: service.price ?? "",
          duration: service.duration ?? "",
          category: service.category || "",
          requiredRoomType: service.requiredRoomType || "Facial",
          tourCount: service.tourCount ?? "",
          status: service.status || "Active",
        }));
      })
      .catch((error) => {
        console.error("Error fetching service data:", error);
        if (!cancelled) {
          setLoadError(getRequestErrorMessage(error, "Could not load the service information. Please try again."));
        }
      })
      .finally(() => {
        if (!cancelled) setLoadedRequestKey(`${id}:${loadAttempt}`);
      });
    return () => {
      cancelled = true;
    };
  }, [id, loadAttempt]);

  // Technicians and which of them are already qualified for this service
  useEffect(() => {
    axios
      .get(`/api/service?technicians=${id}`)
      .then((response) => {
        const rows = Array.isArray(response.data) ? response.data : [];
        setTechnicians(rows);
        setFormData((current) => ({
          ...current,
          technicianIds: rows.filter((t) => Number(t.qualified) === 1).map((t) => t.staffId),
        }));
      })
      .catch(() => setTechnicians([]));
  }, [id, loadAttempt]);

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
      setRemoveImage(false);
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
      await axios.put(`/api/service?id=${id}`, buildServicePayload(formData));

      let imageNotice = "";
      try {
        if (imageUpload) {
          await axios.post(`/api/service-image/${id}`, imageUpload);
        } else if (removeImage) {
          await axios.delete(`/api/service-image/${id}`);
        }
      } catch (imageErr) {
        imageNotice = ` But the image could not be saved: ${getRequestErrorMessage(imageErr, "image upload error")}.`;
      }

      navigate("/services", {
        replace: true,
        state: { serviceNotice: "Service information updated." + imageNotice },
      });
    } catch (error) {
      console.error("Error updating service:", error);
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
        title="Edit service"
        description="Keep information up to date so customers and staff always have accurate data."
      />

      {loading || loadError ? (
        <ServiceLoadState
          loading={loading}
          loadError={loadError}
          onRetry={() => setLoadAttempt((attempt) => attempt + 1)}
        />
      ) : (
        <div className="service-admin-content">
          <section className="service-admin-form-card">
            <div className="service-admin-card-heading">
              <span className="service-admin-card-icon">
                <i className="bi bi-pencil-square" aria-hidden="true" />
              </span>
              <div>
                <h2>Update information</h2>
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
                imageUrl={imageUrl}
                imageError={imageError}
                onImageChange={handleImageChange}
                removeImage={removeImage}
                onRemoveImage={() => setRemoveImage(true)}
                onUndoRemoveImage={() => setRemoveImage(false)}
              />
              <ServiceFormActions saving={saving} submitLabel="Save changes" submitIcon="bi-check2" />
            </form>
          </section>

          <ServiceGuidance />
        </div>
      )}
    </main>
  );
};

export default UpdateServiceForm;
