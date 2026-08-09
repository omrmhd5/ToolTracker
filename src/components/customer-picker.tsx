"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export type CustomerOption = {
  id: string;
  employeeId: string;
  name: string;
  specialization: string;
};

export function CustomerPicker({
  customers,
  value,
  onChange,
}: {
  customers: CustomerOption[];
  value: string;
  onChange: (id: string) => void;
}) {
  const [query, setQuery] = useState("");

  const selected = customers.find((customer) => customer.id === value);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return customers;

    return customers.filter(
      (customer) =>
        customer.employeeId.toLowerCase().includes(term) ||
        customer.name.toLowerCase().includes(term) ||
        customer.specialization.toLowerCase().includes(term),
    );
  }, [customers, query]);

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
            onClick={() => {
              onChange("");
              setQuery("");
            }}>
            Change
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Label htmlFor="customerSearch">Customer</Label>
      <Input
        id="customerSearch"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search by employee ID, name, or specialization..."
      />
      <div className="max-h-48 overflow-y-auto rounded-md border">
        {filtered.length === 0 ? (
          <p className="p-3 text-sm text-muted-foreground">
            No customers found.
          </p>
        ) : (
          filtered.map((customer) => (
            <button
              key={customer.id}
              type="button"
              onClick={() => {
                onChange(customer.id);
                setQuery("");
              }}
              className="w-full border-b px-3 py-2 text-left text-sm last:border-0 hover:bg-accent">
              <p className="font-medium">{customer.employeeId}</p>
              <p className="text-muted-foreground">{customer.name}</p>
              <p className="text-xs text-muted-foreground">
                {customer.specialization}
              </p>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
