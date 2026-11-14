package bssms_controller.DatTT;

import bssms_catalog.Service;
import bssms_persistence.DatTT.ServiceDAO;
import java.sql.SQLException;
import java.util.List;

public class ServiceController {
    private final ServiceDAO serviceDAO;

    public ServiceController(ServiceDAO serviceDAO) {
        this.serviceDAO = serviceDAO;
    }

    public List<Service> getAllServices() throws SQLException {
        return serviceDAO.getAllServices();
    }

    public Service getServiceById(int id) throws SQLException {
        validateId(id);
        Service service = serviceDAO.getServiceById(id);
        if (service == null) throw new NotFoundException();
        return service;
    }

    public int createService(Service service) throws SQLException {
        validateService(service);
        int id = serviceDAO.addServiceReturningId(service);
        if (id <= 0) throw new SQLException("Service insert did not affect exactly one row");
        serviceDAO.saveTechnicians(id, service.getTechnicianIds());
        return id;
    }

    public void updateService(int id, Service service) throws SQLException {
        validateId(id);
        validateService(service);
        service.setServiceId(id);
        if (serviceDAO.updateService(service) == 0) throw new NotFoundException();
        serviceDAO.saveTechnicians(id, service.getTechnicianIds());
    }

    public java.util.List<java.util.Map<String,Object>> technicians(int id) throws SQLException {
        validateId(id);
        return serviceDAO.technicians(id);
    }

    public java.util.Map<String,Object> deleteService(int id) throws SQLException {
        validateId(id);
        int future = serviceDAO.futureAppointments(id);
        if (serviceDAO.deleteService(id) == 0) throw new NotFoundException();
        return java.util.Map.of("futureAppointments", future, "message", future == 0 ? "Đã ngừng kinh doanh dịch vụ." : "Đã ngừng kinh doanh. " + future + " lịch hẹn tương lai vẫn được giữ.");
    }

    private void validateId(int id) {
        if (id <= 0) throw new IllegalArgumentException("Service id must be a positive integer.");
    }

    private void validateService(Service service) {
        if (service == null) throw new IllegalArgumentException("Service data is required.");
        if (service.getServiceName() == null || service.getServiceName().trim().isEmpty()) {
            throw new IllegalArgumentException("Service name is required.");
        }
        if (!Double.isFinite(service.getPrice()) || service.getPrice() <= 0) {
            throw new IllegalArgumentException("Price must be greater than zero.");
        }
        if (service.getDuration() <= 0 || service.getDuration() % 15 != 0 || service.getDuration() > 600) {
            throw new IllegalArgumentException("Thời lượng phải là bội số của 15 phút (tối đa 600 phút).");
        }
        if (!java.util.Arrays.asList("Facial", "Massage", "HairWash", "Body").contains(service.getRequiredRoomType())) {
            throw new IllegalArgumentException("Loại phòng phải là Facial, Massage, HairWash hoặc Body.");
        }
        if (service.getTourCount() != null && (service.getTourCount() < 1 || service.getTourCount() > 10 || service.getTourCount() != Math.floor(service.getTourCount()))) {
            throw new IllegalArgumentException("Số tour phải là số nguyên từ 1 đến 10.");
        }
        if (service.getCategory() == null || service.getCategory().isBlank()) service.setCategory("General");
        if (service.getStatus() == null) service.setStatus("Active");
        String status = service.getStatus();
        if (!"Active".equals(status) && !"Inactive".equals(status)) {
            throw new IllegalArgumentException("Status must be Active or Inactive.");
        }
        service.setServiceName(service.getServiceName().trim());
    }

    public static class NotFoundException extends RuntimeException {
        public NotFoundException() { super("Service not found."); }
    }
}
