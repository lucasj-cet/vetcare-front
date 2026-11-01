import {
  Group,
  Modal,
  NumberInput,
  SegmentedControl,
  Select,
  SimpleGrid,
  Text,
  TextInput,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { api } from "../api";
import { PAYMENT_METHODS } from "../data/seed";
import { useApi, useSubmit } from "../hooks/useApi";
import { act } from "../lib/notify";
import { brl } from "../lib/format";
import { FormActions } from "./ui";

const SHORT = {
  "Cartão de crédito": "Crédito",
  "Cartão de débito": "Débito",
  PIX: "PIX",
  Dinheiro: "Dinheiro",
  Boleto: "Boleto",
};

export default function PaymentModal({ opened, onClose, charge }) {
  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Registrar pagamento"
      size="lg"
    >
      {opened && <PaymentForm onClose={onClose} charge={charge} />}
    </Modal>
  );
}

function PaymentForm({ onClose, charge }) {
  const pending = useApi(() => api.charges.pending(), []);
  const pets = useApi(() => api.pets.list(), []);

  const form = useForm({
    initialValues: {
      source: "pendente",
      chargeId: charge?.id ?? null,
      description: "",
      petId: null,
      amount: "",
      method: "PIX",
      installments: "1",
      received: "",
    },
    validate: {
      chargeId: (v, values) =>
        values.source === "pendente" && !v ? "Escolha a cobrança" : null,
      description: (v, values) =>
        values.source === "avulso" && !v.trim()
          ? "Descreva o que está sendo pago"
          : null,
      amount: (v, values) =>
        values.source === "avulso" && !(Number(v) > 0)
          ? "Informe o valor"
          : null,
      received: (v, values) => {
        if (values.method !== "Dinheiro" || v === "") return null;
        return Number(v) < total(values)
          ? "Valor recebido menor que o total"
          : null;
      },
    },
  });
  const v = form.values;
  const source = v.source;
  const selected = (pending.data ?? []).find((c) => c.id === v.chargeId);
  const total = (values) =>
    values.source === "pendente"
      ? ((pending.data ?? []).find((c) => c.id === values.chargeId)?.amount ??
        0)
      : Number(values.amount) || 0;
  const amount = total(v);
  const change =
    v.method === "Dinheiro" && Number(v.received) > amount
      ? Number(v.received) - amount
      : 0;

  const [saving, submit] = useSubmit();
  const onSubmit = form.onSubmit((values) =>
    submit(async () => {
      const installments =
        values.method === "Cartão de crédito" ? Number(values.installments) : 1;
      const ok =
        values.source === "pendente"
          ? await act(
              api.charges.pay(values.chargeId, {
                method: values.method,
                installments,
              }),
              "Pagamento registrado. Baixa feita no caixa.",
            )
          : await act(
              api.charges.createPaid({
                description: values.description.trim(),
                petId: values.petId,
                amount: Number(values.amount),
                method: values.method,
                installments,
              }),
              "Pagamento registrado no caixa.",
            );
      if (ok) onClose();
    }),
  );

  return (
    <form onSubmit={onSubmit} noValidate>
      {!charge && (
        <SegmentedControl
          fullWidth
          mb="md"
          value={source}
          onChange={(value) => form.setFieldValue("source", value)}
          data={[
            { value: "pendente", label: "Cobrança em aberto" },
            { value: "avulso", label: "Lançamento avulso" },
          ]}
        />
      )}

      {source === "pendente" ? (
        <Select
          label="Cobrança"
          placeholder={pending.loading ? "Carregando…" : "Escolha"}
          data={(pending.data ?? []).map((c) => ({
            value: c.id,
            label: `${c.description} · ${brl(c.amount)}`,
          }))}
          nothingFoundMessage="Nenhuma cobrança em aberto"
          disabled={!!charge}
          searchable
          {...form.getInputProps("chargeId")}
        />
      ) : (
        <SimpleGrid cols={{ base: 1, sm: 2 }}>
          <TextInput
            label="Descrição"
            placeholder="Ex.: Venda · Antipulgas"
            {...form.getInputProps("description")}
          />
          <NumberInput
            label="Valor"
            prefix="R$ "
            decimalSeparator=","
            thousandSeparator="."
            decimalScale={2}
            min={0}
            hideControls
            {...form.getInputProps("amount")}
          />
          <Select
            label="Paciente (opcional)"
            searchable
            clearable
            data={(pets.data ?? []).map((p) => ({
              value: p.id,
              label: `${p.name} · ${p.tutor?.name ?? ""}`,
            }))}
            {...form.getInputProps("petId")}
          />
        </SimpleGrid>
      )}

      {selected?.tutor && (
        <Text size="sm" c="dimmed" mt={6}>
          Tutor: {selected.tutor.name} · {selected.tutor.phone}
        </Text>
      )}

      <Text size="sm" fw={500} mt="lg" mb={6}>
        Forma de pagamento
      </Text>
      <SegmentedControl
        fullWidth
        value={v.method}
        onChange={(m) => form.setFieldValue("method", m)}
        data={PAYMENT_METHODS.map((m) => ({ value: m, label: SHORT[m] }))}
      />

      <SimpleGrid cols={{ base: 1, sm: 2 }} mt="md">
        {v.method === "Cartão de crédito" && (
          <Select
            label="Parcelas"
            allowDeselect={false}
            data={Array.from({ length: 6 }, (_, i) => ({
              value: String(i + 1),
              label:
                i === 0 ? "À vista" : `${i + 1}x de ${brl(amount / (i + 1))}`,
            }))}
            {...form.getInputProps("installments")}
          />
        )}
        {v.method === "Dinheiro" && (
          <NumberInput
            label="Valor recebido"
            prefix="R$ "
            decimalSeparator=","
            thousandSeparator="."
            decimalScale={2}
            min={0}
            hideControls
            {...form.getInputProps("received")}
          />
        )}
      </SimpleGrid>

      <Group
        justify="space-between"
        mt="lg"
        pt="md"
        style={{ borderTop: "1px solid var(--vc-line)" }}
      >
        <Text c="dimmed" size="sm">
          {change > 0 ? `Troco: ${brl(change)}` : "Total a receber"}
        </Text>
        <Text fw={600} size="xl" className="tnum">
          {brl(amount)}
        </Text>
      </Group>
      <FormActions
        onCancel={onClose}
        loading={saving}
        submitLabel="Confirmar baixa"
      />
    </form>
  );
}
