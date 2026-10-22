package bssms_controller.DatTT;

import bssms_catalog.Service;
import bssms_persistence.DatTT.ServiceDAO;
import java.sql.SQLException;
import java.util.List;

/** Plain Java controller: validation and coordination, independent of HTTP. */
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

    public void createService(Service service) throws SQLException {
        validateService(service);
        if (serviceDAO.addService(service) != 1) {
            throw new SQLException("Service insert did not affect exactly one row");
        }
    }

    public void updateService(int id, Service service) throws SQLException {
        validateId(id);
        validateService(service);
        service.setServiceId(id); // URL id is authoritative.
        if (serviceDAO.updateService(service) == 0) throw new NotFoundException();
    }

    public void deleteService(int id) throws SQLException {
        validateId(id);
        if (serviceDAO.deleteService(id) == 0) throw new NotFoundException();
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
        if (service.getDuration() <= 0) {
            throw new IllegalArgumentException("Duration must be greater than zero.");
        }
        String status = service.getStatus();
        if (!"Active".equals(status) && !"Inactive".equals(status)
                && !"Maintenance".equals(status)) {
            throw new IllegalArgumentException("Status must be Active, Inactive or Maintenance.");
        }
        service.setServiceName(service.getServiceName().trim());
    }

    public static class NotFoundException extends RuntimeException {
        public NotFoundException() { super("Service not found."); }
    }
}
