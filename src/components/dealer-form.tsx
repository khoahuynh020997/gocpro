import { Field } from "@/components/forms";
import { Button } from "@/components/ui/button";
import { Input, NativeSelect, Textarea } from "@/components/ui/input";
import { PROVINCES } from "@/lib/format";
import type { DealerLevel } from "@/lib/types";

export type DealerFormValue = {
  name: string;
  owner: string;
  phone: string;
  address: string;
  province: string;
  district: string;
  level: DealerLevel;
  creditLimit: number;
  notes: string;
};

export const emptyDealerForm: DealerFormValue = {
  name: "",
  owner: "",
  phone: "",
  address: "",
  province: "An Giang",
  district: "",
  level: "cap2",
  creditLimit: 200_000_000,
  notes: "",
};

export function DealerForm({
  value,
  onChange,
  onSubmit,
  submitLabel = "Lưu đại lý",
}: {
  value: DealerFormValue;
  onChange: (v: DealerFormValue) => void;
  onSubmit: () => void;
  submitLabel?: string;
}) {
  const set = (patch: Partial<DealerFormValue>) => onChange({ ...value, ...patch });
  return (
    <form
      className="grid gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
    >
      <Field label="Tên cửa hàng / đại lý">
        <Input value={value.name} onChange={(e) => set({ name: e.target.value })} required />
      </Field>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Chủ đại lý">
          <Input value={value.owner} onChange={(e) => set({ owner: e.target.value })} />
        </Field>
        <Field label="Số điện thoại">
          <Input
            inputMode="tel"
            value={value.phone}
            onChange={(e) => set({ phone: e.target.value })}
          />
        </Field>
      </div>
      <Field label="Địa chỉ">
        <Input value={value.address} onChange={(e) => set({ address: e.target.value })} />
      </Field>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Tỉnh">
          <NativeSelect
            value={value.province}
            onChange={(e) => set({ province: e.target.value })}
          >
            {PROVINCES.map((p) => (
              <option key={p}>{p}</option>
            ))}
          </NativeSelect>
        </Field>
        <Field label="Huyện / TP">
          <Input value={value.district} onChange={(e) => set({ district: e.target.value })} />
        </Field>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Hạng">
          <NativeSelect
            value={value.level}
            onChange={(e) => set({ level: e.target.value as DealerLevel })}
          >
            <option value="cap1">Đại lý cấp 1</option>
            <option value="cap2">Đại lý cấp 2</option>
            <option value="nongho">Nông hộ lớn</option>
          </NativeSelect>
        </Field>
        <Field label="Hạn mức công nợ (đ)">
          <Input
            type="number"
            min={0}
            value={value.creditLimit}
            onChange={(e) => set({ creditLimit: Number(e.target.value) })}
          />
        </Field>
      </div>
      <Field label="Ghi chú">
        <Textarea value={value.notes} onChange={(e) => set({ notes: e.target.value })} />
      </Field>
      <Button type="submit" className="mt-1">
        {submitLabel}
      </Button>
    </form>
  );
}
