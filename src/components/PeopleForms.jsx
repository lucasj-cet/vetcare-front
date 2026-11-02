import {
  ActionIcon,
  Button,
  Divider,
  Group,
  Loader,
  Modal,
  NumberInput,
  SegmentedControl,
  Select,
  SimpleGrid,
  Stack,
  Tabs,
  Text,
  TextInput,
  Textarea,
  UnstyledButton,
} from "@mantine/core";
import { DatePickerInput } from "@mantine/dates";
import { IconPencil, IconSearch, IconX } from "@tabler/icons-react";
import { useDebouncedValue } from "@mantine/hooks";
import { useForm } from "@mantine/form";
import dayjs from "dayjs";
import { useState } from "react";
import {
  useCreatePetOwner,
  usePetOwner,
  usePetOwners,
  useUpdatePetOwner,
} from "../api/queries/petOwners";
import { useCreatePet, useUpdatePet } from "../api/queries/pets";
import { toast } from "../lib/notify";
import {
  hideCpf,
  isEmail,
  maskCpf,
  maskPhone,
  onlyDigits,
  toISO,
} from "../lib/format";
import { Facts, FormActions } from "./ui";

const petInitial = (p = {}) => ({
  name: p.name ?? "",
  species: p.species ?? "Cão",
  breed: p.breed ?? "",
  sex: p.sex ?? "Macho",
  birth: p.birth ? dayjs(p.birth).toDate() : null,
  weight: p.weight ?? "",
  alerts: p.alerts ?? "",
});

const petRules = (on = () => true) => ({
  name: (v, values) =>
    on(values) && v.trim().length < 2 ? "Informe o nome do pet" : null,
  breed: (v, values) =>
    on(values) && !v.trim() ? "Informe a raça (ou SRD)" : null,
});

const petPayload = (p) => ({
  name: p.name.trim(),
  species: p.species,
  breed: p.breed.trim(),
  sex: p.sex,
  birth: toISO(p.birth),
  weight: p.weight === "" ? null : Number(p.weight),
  alerts: p.alerts.trim(),
});

function PetFields({ form, prefix = "" }) {
  const f = (k) => form.getInputProps(prefix + k);
  return (
    <SimpleGrid cols={{ base: 1, sm: 2 }}>
      <TextInput label="Nome do pet" {...f("name")} />
      <div>
        <Text size="sm" fw={500} mb={4}>
          Espécie
        </Text>
        <SegmentedControl fullWidth data={["Cão", "Gato"]} {...f("species")} />
      </div>
      <TextInput
        label="Raça"
        placeholder="Ex.: Golden Retriever ou SRD"
        {...f("breed")}
      />
      <Select
        label="Sexo"
        data={["Macho", "Fêmea"]}
        allowDeselect={false}
        {...f("sex")}
      />
      <DatePickerInput
        label="Nascimento (aproximado)"
        valueFormat="DD/MM/YYYY"
        maxDate={new Date()}
        clearable
        {...f("birth")}
      />
      <NumberInput
        label="Peso"
        suffix=" kg"
        decimalSeparator=","
        decimalScale={1}
        min={0}
        max={120}
        hideControls
        {...f("weight")}
      />
      <Textarea
        label="Alertas clínicos"
        description="Alergias, doenças crônicas, cuidados na manipulação"
        autosize
        minRows={1}
        style={{ gridColumn: "1 / -1" }}
        {...f("alerts")}
      />
    </SimpleGrid>
  );
}

const ownerRules = (isEdit, on = () => true) => ({
  name: (v, values) =>
    on(values) && v.trim().split(" ").length < 2
      ? "Informe nome e sobrenome"
      : null,
  cpf: (v, values) =>
    on(values) && !isEdit && onlyDigits(v).length !== 11
      ? "CPF precisa ter 11 dígitos"
      : null,
  phone: (v, values) =>
    on(values) && onlyDigits(v).length < 10 ? "Telefone com DDD" : null,
  email: (v, values) => (on(values) && !isEmail(v) ? "E-mail inválido" : null),
});

function OwnerFields({ form, isEdit }) {
  return (
    <SimpleGrid cols={{ base: 1, sm: 2 }}>
      <TextInput
        label="Nome completo"
        autoComplete="off"
        {...form.getInputProps("name")}
      />
      <TextInput
        label="CPF"
        placeholder="000.000.000-00"
        inputMode="numeric"
        disabled={isEdit}
        {...form.getInputProps("cpf")}
        onChange={(e) =>
          form.setFieldValue("cpf", maskCpf(e.currentTarget.value))
        }
      />
      <TextInput
        label="Telefone"
        placeholder="(00) 00000-0000"
        inputMode="tel"
        {...form.getInputProps("phone")}
        onChange={(e) =>
          form.setFieldValue("phone", maskPhone(e.currentTarget.value))
        }
      />
      <TextInput label="E-mail" type="email" {...form.getInputProps("email")} />
      <TextInput
        label="Endereço"
        placeholder="Rua, número · bairro, cidade"
        style={{ gridColumn: "1 / -1" }}
        {...form.getInputProps("address")}
      />
    </SimpleGrid>
  );
}

const ownerPayload = (v) => ({
  name: v.name.trim(),
  cpf: v.cpf,
  phone: v.phone,
  email: v.email.trim().toLowerCase(),
  address: v.address.trim(),
});

export function PetOwnerModal({ opened, onClose, petOwner }) {
  return (
    <Modal opened={opened} onClose={onClose} title="Editar tutor" size="xl">
      {opened && <PetOwnerForm onClose={onClose} petOwner={petOwner} />}
    </Modal>
  );
}

function PetOwnerForm({ onClose, petOwner }) {
  const form = useForm({
    initialValues: {
      name: petOwner?.name ?? "",
      cpf: hideCpf(petOwner?.cpf),
      phone: petOwner?.phone ?? "",
      email: petOwner?.email ?? "",
      address: petOwner?.address ?? "",
    },
    validate: ownerRules(true),
  });
  const update = useUpdatePetOwner();
  const onSubmit = form.onSubmit((v) =>
    update.mutate(
      { id: petOwner.id, ...ownerPayload(v) },
      {
        onSuccess: () => {
          toast.ok("Cadastro atualizado.");
          onClose();
        },
      },
    ),
  );

  return (
    <form onSubmit={onSubmit} noValidate>
      <OwnerFields form={form} isEdit />
      <FormActions
        onCancel={onClose}
        loading={update.isPending}
        submitLabel="Salvar cadastro"
      />
    </form>
  );
}

export function NewPatientModal({ opened, onClose }) {
  return (
    <Modal opened={opened} onClose={onClose} title="Novo paciente" size="xl">
      {opened && <NewPatientForm onClose={onClose} />}
    </Modal>
  );
}

function ExistingOwnerPicker({ form }) {
  const [search, setSearch] = useState("");
  const [debounced] = useDebouncedValue(search, 300);
  const [editing, setEditing] = useState(false);
  const id = form.values.petOwnerId;
  const searching = debounced.trim().length > 0;
  const results = usePetOwners({ search: debounced, enabled: searching });
  const selected = usePetOwner(id);
  const owner = selected.data;

  const pick = (o) => {
    form.setFieldValue("petOwnerId", o.id);
    setSearch("");
  };

  return (
    <Stack gap="sm">
      <div style={{ position: "relative" }}>
        <TextInput
          label="Buscar tutor"
          autoFocus
          placeholder="Nome, CPF ou telefone"
          leftSection={<IconSearch size={15} />}
          rightSection={
            searching && results.isFetching ? <Loader size="xs" /> : null
          }
          value={search}
          onChange={(e) => setSearch(e.currentTarget.value)}
          error={!id && form.errors.petOwnerId}
          autoComplete="off"
        />

        {searching && (
          <Stack
            gap={0}
            style={{
              position: "absolute",
              top: "100%",
              left: 0,
              right: 0,
              zIndex: 10,
              maxHeight: 240,
              overflowY: "auto",
              background: "var(--mantine-color-body)",
              border: "1px solid var(--vc-line)",
              borderRadius: 8,
              boxShadow: "var(--mantine-shadow-md)",
            }}
          >
            {(results.data?.rows ?? []).map((o, i) => (
              <UnstyledButton
                key={o.id}
                onClick={() => pick(o)}
                p="sm"
                style={
                  i ? { borderTop: "1px solid var(--vc-line)" } : undefined
                }
              >
                <Text size="sm" fw={500}>
                  {o.name}
                </Text>
                <Text size="xs" c="dimmed">
                  {hideCpf(o.cpf)} · {o.phone}
                </Text>
              </UnstyledButton>
            ))}
            {results.data && results.data.rows.length === 0 && (
              <Text size="sm" c="dimmed" p="sm">
                Nenhum tutor encontrado.
              </Text>
            )}
          </Stack>
        )}
      </div>

      {id && (
        <div
          style={{
            border: "1px solid var(--vc-line)",
            borderRadius: 8,
            overflow: "hidden",
          }}
        >
          {!owner ? (
            <Group p="md" justify="center">
              <Loader size="sm" />
            </Group>
          ) : (
            <>
              <Group justify="space-between" p="sm" wrap="nowrap">
                <Text fw={600}>{owner.name}</Text>
                <Group gap="xs" wrap="nowrap">
                  <Button
                    variant="default"
                    size="xs"
                    leftSection={<IconPencil size={14} />}
                    onClick={() => setEditing(true)}
                  >
                    Editar
                  </Button>
                  <ActionIcon
                    variant="default"
                    size={30}
                    aria-label="Trocar tutor"
                    onClick={() => form.setFieldValue("petOwnerId", null)}
                  >
                    <IconX size={15} />
                  </ActionIcon>
                </Group>
              </Group>
              <Facts
                items={[
                  [
                    "CPF",
                    <span key="cpf" className="tnum">
                      {hideCpf(owner.cpf)}
                    </span>,
                  ],
                  ["Telefone", owner.phone],
                ]}
              />
              <Facts
                items={[
                  ["E-mail", owner.email],
                  ["Endereço", owner.address || null],
                ]}
              />
            </>
          )}
        </div>
      )}

      <PetOwnerModal
        opened={editing && !!owner}
        onClose={() => setEditing(false)}
        petOwner={owner}
      />
    </Stack>
  );
}

function NewPatientForm({ onClose }) {
  const form = useForm({
    initialValues: {
      mode: "new",
      petOwnerId: null,
      name: "",
      cpf: "",
      phone: "",
      email: "",
      address: "",
      pet: petInitial(),
    },
    validate: {
      ...ownerRules(false, (values) => values.mode === "new"),
      petOwnerId: (v, values) =>
        values.mode === "existing" && !v ? "Selecione o tutor" : null,
      pet: petRules((values) => values.mode === "new" || !!values.petOwnerId),
    },
  });
  const createOwner = useCreatePetOwner();
  const createPet = useCreatePet();
  const saving = createOwner.isPending || createPet.isPending;

  const onSubmit = form.onSubmit((v) => {
    const pet = petPayload(v.pet);
    const done = (ownerName) => ({
      onSuccess: () => {
        toast.ok(
          `${pet.name} cadastrado${ownerName ? ` com ${ownerName}` : ""}.`,
        );
        onClose();
      },
    });
    if (v.mode === "existing")
      return createPet.mutate({ petOwnerId: v.petOwnerId, ...pet }, done());
    const owner = ownerPayload(v);
    createOwner.mutate({ ...owner, pet }, done(owner.name));
  });

  return (
    <form onSubmit={onSubmit} noValidate>
      <Tabs
        value={form.values.mode}
        onChange={(mode) => {
          form.setFieldValue("mode", mode);
          form.clearErrors();
        }}
      >
        <Tabs.List mb="md">
          <Tabs.Tab value="new" style={{ flex: 1 }}>
            Cadastrar tutor
          </Tabs.Tab>
          <Tabs.Tab value="existing" style={{ flex: 1 }}>
            Tutor já cadastrado
          </Tabs.Tab>
        </Tabs.List>
        <Tabs.Panel value="new">
          <OwnerFields form={form} />
        </Tabs.Panel>
        <Tabs.Panel value="existing">
          <ExistingOwnerPicker form={form} />
        </Tabs.Panel>
      </Tabs>

      <Divider my="lg" />
      <Text fw={700} size="lg" mb="xs">
        Pet
      </Text>
      <PetFields form={form} prefix="pet." />

      <FormActions
        onCancel={onClose}
        loading={saving}
        submitLabel="Salvar paciente"
      />
    </form>
  );
}

export function PetModal({ opened, onClose, pet, petOwnerId, petOwnerName }) {
  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        pet
          ? `Editar ${pet.name}`
          : `Novo pet${petOwnerName ? ` de ${petOwnerName}` : ""}`
      }
      size="xl"
    >
      {opened && (
        <PetForm onClose={onClose} pet={pet} petOwnerId={petOwnerId} />
      )}
    </Modal>
  );
}

function PetForm({ onClose, pet, petOwnerId }) {
  const form = useForm({
    initialValues: petInitial(pet),
    validate: petRules(),
  });
  const create = useCreatePet({
    onSuccess: (_, data) => {
      toast.ok(`${data.name} cadastrado.`);
      onClose();
    },
  });
  const update = useUpdatePet({
    onSuccess: () => {
      toast.ok("Dados do pet atualizados.");
      onClose();
    },
  });

  const saving = create.isPending || update.isPending;

  const onSubmit = form.onSubmit((v) => {
    const data = petPayload(v);

    if (pet) {
      return update.mutate({ id: pet.id, ...data });
    }

    create.mutate({ petOwnerId, ...data });
  });
  return (
    <form onSubmit={onSubmit} noValidate>
      <PetFields form={form} />
      <FormActions
        onCancel={onClose}
        loading={saving}
        submitLabel="Salvar pet"
      />
    </form>
  );
}
