import {
  Checkbox,
  Divider,
  Modal,
  NumberInput,
  SegmentedControl,
  Select,
  SimpleGrid,
  Text,
  TextInput,
  Textarea,
} from "@mantine/core";
import { DatePickerInput } from "@mantine/dates";
import { useForm } from "@mantine/form";
import dayjs from "dayjs";
import { useCreatePetOwner, useUpdatePetOwner } from "../api/queries/petOwners";
import { useCreatePet, useUpdatePet } from "../api/queries/pets";
import { toast } from "../lib/notify";
import { isEmail, maskCpf, maskPhone, onlyDigits, toISO } from "../lib/format";
import { FormActions } from "./ui";

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

export function PetOwnerModal({ opened, onClose, petOwner }) {
  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={petOwner ? "Editar tutor" : "Cadastro de tutor e pet"}
      size="xl"
    >
      {opened && <PetOwnerForm onClose={onClose} petOwner={petOwner} />}
    </Modal>
  );
}

function PetOwnerForm({ onClose, petOwner }) {
  const form = useForm({
    initialValues: {
      name: petOwner?.name ?? "",
      cpf: petOwner?.cpf ?? "",
      phone: petOwner?.phone ?? "",
      email: petOwner?.email ?? "",
      address: petOwner?.address ?? "",
      withPet: !petOwner,
      pet: petInitial(),
    },
    validate: {
      name: (v) =>
        v.trim().split(" ").length < 2 ? "Informe nome e sobrenome" : null,
      cpf: (v) =>
        onlyDigits(v).length !== 11 ? "CPF precisa ter 11 dígitos" : null,
      phone: (v) => (onlyDigits(v).length < 10 ? "Telefone com DDD" : null),
      email: (v) => (!isEmail(v) ? "E-mail inválido" : null),
      pet: petRules((values) => values.withPet),
    },
  });
  const create = useCreatePetOwner();
  const update = useUpdatePetOwner();
  const saving = create.isPending || update.isPending;
  const onSubmit = form.onSubmit((v) => {
    const data = {
      name: v.name.trim(),
      cpf: v.cpf,
      phone: v.phone,
      email: v.email.trim().toLowerCase(),
      address: v.address.trim(),
    };
    if (petOwner)
      return update.mutate(
        { id: petOwner.id, ...data },
        {
          onSuccess: () => {
            toast.ok("Cadastro atualizado.");
            onClose();
          },
        },
      );
    create.mutate(
      { ...data, pet: v.withPet ? petPayload(v.pet) : undefined },
      {
        onSuccess: () => {
          toast.ok(
            v.withPet
              ? `${data.name} e ${v.pet.name.trim()} cadastrados.`
              : "Tutor cadastrado.",
          );
          onClose();
        },
      },
    );
  });

  const isEdit = Boolean(petOwner);

  return (
    <form onSubmit={onSubmit} noValidate>
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
        <TextInput
          label="E-mail"
          type="email"
          {...form.getInputProps("email")}
        />
        <TextInput
          label="Endereço"
          placeholder="Rua, número · bairro, cidade"
          style={{ gridColumn: "1 / -1" }}
          {...form.getInputProps("address")}
        />
      </SimpleGrid>

      {!petOwner && (
        <>
          <Divider my="lg" />
          <Checkbox
            label="Cadastrar o primeiro pet agora"
            {...form.getInputProps("withPet", { type: "checkbox" })}
            mb="md"
          />
          {form.values.withPet && <PetFields form={form} prefix="pet." />}
        </>
      )}
      <FormActions
        onCancel={onClose}
        loading={saving}
        submitLabel="Salvar cadastro"
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
