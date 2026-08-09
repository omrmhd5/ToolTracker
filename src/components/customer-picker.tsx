"use client";

import { useCallback, useEffect, useState } from "react";
import { Users } from "lucide-react";
import {
  searchCustomersForCheckout,
  type CustomerOption,
} from "@/actions/checkout";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export type { CustomerOption };

export function CustomerPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (id: string) => void;
}) {
  const [selected, setSelected] = useState<CustomerOption | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [loading, setLoading] = useState(false);
  const [hasAnyCustomers, setHasAnyCustomers] = useState<boolean | null>(null);

  const loadCustomers = useCallback(async (q: string, nextPage: number) => {
    setLoading(true);
    const result = await searchCustomersForCheckout({ q, page: nextPage });
    setCustomers(result.customers);
    setTotal(result.total);
    setTotalPages(result.totalPages);
    setPageSize(result.pageSize);
    setPage(result.page);
    setLoading(false);

    if (!q && nextPage === 1) {
      setHasAnyCustomers(result.total > 0);
    }
  }, []);

  useEffect(() => {
    if (!value) {
      setSelected(null);
    }
  }, [value]);

  useEffect(() => {
    void loadCustomers("", 1);
  }, [loadCustomers]);

  useEffect(() => {
    if (modalOpen) {
      void loadCustomers(query, page);
    }
  }, [modalOpen, query, page, loadCustomers]);

  function openModal() {
    setSearchInput("");
    setQuery("");
    setPage(1);
    setModalOpen(true);
  }

  function handleSearch(event: React.FormEvent) {
    event.preventDefault();
    setQuery(searchInput.trim());
    setPage(1);
  }

  function selectCustomer(customer: CustomerOption) {
    setSelected(customer);
    onChange(customer.id);
    setModalOpen(false);
  }

  function clearSelection() {
    setSelected(null);
    onChange("");
  }

  const rangeStart = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const rangeEnd = Math.min(page * pageSize, total);

  if (selected) {
    return (
      <div className="space-y-2">
        <Label>Customer</Label>
        <div className="flex items-start justify-between gap-2 rounded-md border bg-muted/30 px-3 py-2 text-sm">
          <div>
            <p className="font-medium">{selected.employeeId}</p>
            <p className="text-muted-foreground">{selected.name}</p>
            <p className="text-xs text-muted-foreground">
              {selected.specialization}
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="shrink-0"
            onClick={clearSelection}>
            Change
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Label>Customer</Label>
      <Button
        type="button"
        variant="outline"
        className="w-full justify-center"
        onClick={openModal}>
        <Users className="h-4 w-4" />
        Choose customer
      </Button>
      {hasAnyCustomers === false ? (
        <p className="text-sm text-destructive">
          No customers in the system. An admin must add customers first.
        </p>
      ) : null}

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Choose customer</DialogTitle>
            <DialogDescription>
              Search by employee ID, name, or specialization.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSearch} className="flex gap-2">
            <Input
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Search customers..."
              className="flex-1"
            />
            <Button type="submit" variant="secondary" disabled={loading}>
              Search
            </Button>
          </form>

          {loading ? (
            <p className="text-sm text-muted-foreground">
              Loading customers...
            </p>
          ) : customers.length === 0 ? (
            <p className="text-sm text-muted-foreground">No customers found.</p>
          ) : (
            <>
              <div className="rounded-md border">
                {customers.map((customer) => (
                  <button
                    key={customer.id}
                    type="button"
                    onClick={() => selectCustomer(customer)}
                    className="w-full border-b px-3 py-2 text-left text-sm last:border-0 hover:bg-accent">
                    <p className="font-medium">{customer.employeeId}</p>
                    <p className="text-muted-foreground">{customer.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {customer.specialization}
                    </p>
                  </button>
                ))}
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-muted-foreground">
                  Showing {rangeStart}–{rangeEnd} of {total}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={page <= 1 || loading}
                    onClick={() => setPage(page - 1)}>
                    Previous
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Page {page} of {totalPages}
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages || loading}
                    onClick={() => setPage(page + 1)}>
                    Next
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
