package com.verdant.crm.service;

import com.verdant.crm.dto.GlobalSearchDTO.*;
import com.verdant.crm.entity.*;
import com.verdant.crm.repository.*;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class SearchService {

    private final LeadRepository leadRepository;
    private final CustomerRepository customerRepository;
    private final QuoteRepository quoteRepository;
    private final ProjectRepository projectRepository;
    private final PaymentRepository paymentRepository;

    public SearchService(LeadRepository leadRepository,
                         CustomerRepository customerRepository,
                         QuoteRepository quoteRepository,
                         ProjectRepository projectRepository,
                         PaymentRepository paymentRepository) {
        this.leadRepository = leadRepository;
        this.customerRepository = customerRepository;
        this.quoteRepository = quoteRepository;
        this.projectRepository = projectRepository;
        this.paymentRepository = paymentRepository;
    }

    public GlobalSearchResult search(String query) {
        if (query == null || query.trim().length() < 2) {
            return new GlobalSearchResult(query, 0, List.of(), List.of(), List.of(), List.of(), List.of());
        }

        String q = query.trim();
        PageRequest limit = PageRequest.of(0, 5);

        List<SearchItem> leads = leadRepository.globalSearch(q, limit).stream()
                .map(l -> new SearchItem(
                        "LEAD",
                        l.getId(),
                        l.getLeadCode(),
                        l.getName(),
                        l.getCompany() != null ? l.getCompany() : l.getEmail(),
                        l.getEstimatedValue(),
                        l.getStatus(),
                        "info"
                )).collect(Collectors.toList());

        List<SearchItem> customers = customerRepository.globalSearch(q, limit).stream()
                .map(c -> new SearchItem(
                        "CUSTOMER",
                        c.getId(),
                        c.getCustomerCode(),
                        c.getName(),
                        c.getCompany() != null ? c.getCompany() : c.getEmail(),
                        c.getTotalValue(),
                        c.getStatus(),
                        "success"
                )).collect(Collectors.toList());

        List<SearchItem> quotes = quoteRepository.globalSearch(q, limit).stream()
                .map(qu -> new SearchItem(
                        "QUOTE",
                        qu.getId(),
                        qu.getQuoteNumber(),
                        qu.getProjectType() + " (" + qu.getCustomer().getName() + ")",
                        "Margin: " + qu.getCalculatedMarginPercentage() + "%",
                        qu.getAmount(),
                        qu.getStatus(),
                        "warning"
                )).collect(Collectors.toList());

        List<SearchItem> projects = projectRepository.globalSearch(q, limit).stream()
                .map(pr -> new SearchItem(
                        "PROJECT",
                        pr.getId(),
                        pr.getProjectNumber(),
                        pr.getProjectName(),
                        pr.getCustomer().getName() + " — " + pr.getProgressPercentage() + "% complete",
                        pr.getBudget(),
                        pr.getStatus(),
                        "DELAYED".equals(pr.getStatus()) ? "danger" : "info"
                )).collect(Collectors.toList());

        List<SearchItem> payments = paymentRepository.globalSearch(q, limit).stream()
                .map(pay -> new SearchItem(
                        "PAYMENT",
                        pay.getId(),
                        pay.getPaymentCode(),
                        pay.getCustomer().getName() + " (" + pay.getReferenceNumber() + ")",
                        "Due: " + pay.getDueDate(),
                        pay.getAmount(),
                        pay.getStatus(),
                        "OVERDUE".equals(pay.getStatus()) ? "danger" : "success"
                )).collect(Collectors.toList());

        int total = leads.size() + customers.size() + quotes.size() + projects.size() + payments.size();

        return new GlobalSearchResult(query, total, leads, customers, quotes, projects, payments);
    }
}
