package com.quickbooks.controller.admin;

import com.quickbooks.dto.common.PageResponse;
import com.quickbooks.dto.tax.CreateTaxRequest;
import com.quickbooks.dto.tax.TaxResponse;
import com.quickbooks.dto.tax.UpdateTaxRequest;
import com.quickbooks.service.TaxService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/taxes")
public class AdminTaxController {

    private final TaxService taxService;

    public AdminTaxController(TaxService taxService) {
        this.taxService = taxService;
    }

    @GetMapping
    public PageResponse<TaxResponse> list(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return taxService.findPage(page, size);
    }

    @PostMapping
    public TaxResponse create(@Valid @RequestBody CreateTaxRequest request) {
        return taxService.create(request);
    }

    @PutMapping("/{id}")
    public TaxResponse update(@PathVariable Long id,
                              @Valid @RequestBody UpdateTaxRequest request) {
        return taxService.update(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        taxService.delete(id);
    }
}
