package com.verdant.crm.repository;

import com.verdant.crm.entity.ServiceRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ServiceRequestRepository extends JpaRepository<ServiceRequest, Long> {
    Optional<ServiceRequest> findByTicketCode(String ticketCode);

    @Query("SELECT s FROM ServiceRequest s WHERE " +
           "(CAST(:search AS string) IS NULL OR :search = '' OR " +
           "LOWER(s.issue) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%')) OR " +
           "LOWER(s.customer.name) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%')) OR " +
           "LOWER(s.ticketCode) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%'))) AND " +
           "(CAST(:status AS string) IS NULL OR :status = '' OR s.status = CAST(:status AS string)) AND " +
           "(CAST(:priority AS string) IS NULL OR :priority = '' OR s.priority = CAST(:priority AS string))")
    Page<ServiceRequest> searchServiceRequests(@Param("search") String search,
                                              @Param("status") String status,
                                              @Param("priority") String priority,
                                              Pageable pageable);

    long countByStatus(String status);

    List<ServiceRequest> findByCustomerId(Long customerId);
}
