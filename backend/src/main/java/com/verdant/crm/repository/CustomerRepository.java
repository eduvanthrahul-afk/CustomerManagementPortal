package com.verdant.crm.repository;

import com.verdant.crm.entity.Customer;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CustomerRepository extends JpaRepository<Customer, Long> {
    Optional<Customer> findByCustomerCode(String customerCode);

    @Query("SELECT c FROM Customer c WHERE " +
           "(CAST(:search AS string) IS NULL OR :search = '' OR " +
           "LOWER(c.name) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%')) OR " +
           "LOWER(c.company) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%')) OR " +
           "LOWER(c.email) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%')) OR " +
           "LOWER(c.customerCode) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%'))) AND " +
           "(CAST(:status AS string) IS NULL OR :status = '' OR c.status = CAST(:status AS string))")
    Page<Customer> searchCustomers(@Param("search") String search, @Param("status") String status, Pageable pageable);

    @Query("SELECT c FROM Customer c WHERE " +
           "LOWER(c.name) LIKE LOWER(CONCAT('%', CAST(:q AS string), '%')) OR " +
           "LOWER(c.company) LIKE LOWER(CONCAT('%', CAST(:q AS string), '%')) OR " +
           "LOWER(c.email) LIKE LOWER(CONCAT('%', CAST(:q AS string), '%')) OR " +
           "LOWER(c.customerCode) LIKE LOWER(CONCAT('%', CAST(:q AS string), '%'))")
    List<Customer> globalSearch(@Param("q") String q, Pageable pageable);
}
