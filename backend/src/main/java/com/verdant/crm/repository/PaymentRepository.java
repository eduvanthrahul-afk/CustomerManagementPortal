package com.verdant.crm.repository;

import com.verdant.crm.entity.Payment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, Long> {
    Optional<Payment> findByPaymentCode(String paymentCode);

    @Query("SELECT p FROM Payment p WHERE " +
           "(CAST(:search AS string) IS NULL OR :search = '' OR " +
           "LOWER(p.customer.name) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%')) OR " +
           "LOWER(p.referenceNumber) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%')) OR " +
           "LOWER(p.paymentCode) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%'))) AND " +
           "(CAST(:status AS string) IS NULL OR :status = '' OR p.status = CAST(:status AS string))")
    Page<Payment> searchPayments(@Param("search") String search, @Param("status") String status, Pageable pageable);

    @Query("SELECT p FROM Payment p WHERE " +
           "LOWER(p.paymentCode) LIKE LOWER(CONCAT('%', CAST(:q AS string), '%')) OR " +
           "LOWER(p.referenceNumber) LIKE LOWER(CONCAT('%', CAST(:q AS string), '%')) OR " +
           "LOWER(p.customer.name) LIKE LOWER(CONCAT('%', CAST(:q AS string), '%'))")
    List<Payment> globalSearch(@Param("q") String q, Pageable pageable);

    long countByStatus(String status);

    @Query("SELECT COUNT(p) FROM Payment p WHERE p.status = 'OVERDUE' OR (p.status != 'PAID' AND p.dueDate < :today)")
    long countOverduePayments(@Param("today") LocalDate today);

    @Query("SELECT COALESCE(SUM(p.amount), 0) FROM Payment p WHERE p.status = 'OVERDUE' OR (p.status != 'PAID' AND p.dueDate < :today)")
    BigDecimal sumOverduePayments(@Param("today") LocalDate today);

    @Query("SELECT COALESCE(SUM(p.amount), 0) FROM Payment p WHERE p.status = 'PAID'")
    BigDecimal sumCollectedPayments();

    @Query("SELECT p FROM Payment p WHERE p.status = 'OVERDUE' OR (p.status != 'PAID' AND p.dueDate < :today) ORDER BY p.dueDate ASC")
    List<Payment> findOverduePaymentsList(@Param("today") LocalDate today, Pageable pageable);

    List<Payment> findByCustomerId(Long customerId);
}
