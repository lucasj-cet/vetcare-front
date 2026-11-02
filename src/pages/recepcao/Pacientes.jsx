import {
  ActionIcon,
  Button,
  Drawer,
  Group,
  Loader,
  Pagination,
  Stack,
  Text,
  TextInput,
} from "@mantine/core";
import { useDebouncedValue } from "@mantine/hooks";
import {
  IconEye,
  IconEyeOff,
  IconPencil,
  IconPlus,
  IconSearch,
  IconTrash,
} from "@tabler/icons-react";
import { debounce, parseAsInteger, parseAsString, useQueryState } from "nuqs";
import { useEffect, useState } from "react";
import {
  useDeletePetOwner,
  usePetOwner,
  usePetOwners,
} from "../../api/queries/petOwners";
import { useDeletePet, usePets } from "../../api/queries/pets";
import {
  NewPatientModal,
  PetModal,
  PetOwnerModal,
} from "../../components/PeopleForms";
import {
  Async,
  Block,
  ConfirmDialog,
  DataTable,
  Empty,
  Facts,
  Kpis,
  PageHeader,
  PetAvatar,
} from "../../components/ui";
import { age, hideCpf, kg } from "../../lib/format";
import { toast } from "../../lib/notify";

const SEARCH_DEBOUNCE_MS = 500;

export default function Pacientes() {
  const [search, setSearch] = useQueryState(
    "q",
    parseAsString.withDefault("").withOptions({
      history: "replace",
      limitUrlUpdates: debounce(SEARCH_DEBOUNCE_MS),
    }),
  );
  const [debounced] = useDebouncedValue(search, SEARCH_DEBOUNCE_MS);
  const [page, setPage] = useQueryState("page", parseAsInteger.withDefault(1));
  const [newPatient, setNewPatient] = useState(false);
  const [petOwnerForm, setPetOwnerForm] = useState(null); // { petOwner }
  const [petForm, setPetForm] = useState(null); // { pet?, petOwnerId, petOwnerName }
  const [openPetOwner, setOpenPetOwner] = useState(null);
  const [toDelete, setToDelete] = useState(null); // { kind, row }
  const deletePetOwner = useDeletePetOwner({
    onSuccess: (_, id) => {
      toast.ok(`${toDelete.row.name} foi excluído.`);
      setToDelete(null);
      if (openPetOwner === id) setOpenPetOwner(null);
    },
  });
  const deletePet = useDeletePet({
    onSuccess: () => {
      toast.ok(`${toDelete.row.name} foi excluído.`);
      setToDelete(null);
    },
  });
  const deleting = deletePetOwner.isPending || deletePet.isPending;

  const ownersTotal = usePetOwners().data?.total;
  const pets = usePets({ search: debounced, page });
  const petsTotal = usePets().data?.total;

  const total = pets.data?.total ?? 0;
  const pageSize = pets.data?.pageSize;
  const pages =
    total && pageSize ? Math.max(1, Math.ceil(total / pageSize)) : null;
  // after deleting the last row of the last page, fall back to the new last page
  const lastPage = pages ?? 1;
  useEffect(() => {
    if (pets.data && !pets.isPlaceholderData && page > lastPage)
      setPage(lastPage);
  }, [pets.data, pets.isPlaceholderData, page, lastPage, setPage]);
  const petRows = pets.data?.rows ?? [];

  const remove = () => {
    const { kind, row } = toDelete;
    (kind === "petOwner" ? deletePetOwner : deletePet).mutate(row.id);
  };

  const petAlerts = (p) =>
    p.alerts ? (
      <Text size="sm" c="red.8">
        {p.alerts}
      </Text>
    ) : (
      <span className="faint">—</span>
    );

  return (
    <>
      <PageHeader title="Pacientes" finding="Pacientes e tutores da clínica">
        <Button
          leftSection={<IconPlus size={16} />}
          onClick={() => setNewPatient(true)}
        >
          Novo paciente
        </Button>
      </PageHeader>

      <div className="stack">
        <Kpis
          items={[
            { label: "Pacientes", value: petsTotal ?? "—" },
            { label: "Tutores", value: ownersTotal ?? "—" },
          ]}
        />

        <Block flush>
          <Group
            justify="space-between"
            px="lg"
            py="sm"
            gap="xs"
            wrap="nowrap"
            style={{ borderBottom: "1px solid var(--vc-line)" }}
          >
            <TextInput
              leftSection={<IconSearch size={15} />}
              placeholder="Nome, raça, tutor ou CPF"
              value={search}
              onChange={(e) => {
                setSearch(e.currentTarget.value);
                setPage(1);
              }}
              w={{ base: "100%", sm: 300 }}
              aria-label="Buscar"
            />
            {(pets.isLoading || pets.isPlaceholderData) && (
              <Loader size="xs" aria-label="Carregando" />
            )}
          </Group>

          <Async q={pets} rows={6}>
            {() => (
              <DataTable
                rows={petRows}
                empty={
                  search
                    ? `Nenhum paciente encontrado para "${search}".`
                    : "Nenhum paciente cadastrado."
                }
                onRowClick={(p) => setOpenPetOwner(p.petOwnerId)}
                fixed
                columns={[
                  {
                    key: "name",
                    label: "Paciente",
                    width: "32%",
                    render: (p) => (
                      <Group gap="sm" wrap="nowrap">
                        <PetAvatar pet={p} size={30} />
                        <div>
                          <div className="cell-main">{p.name}</div>
                          <div className="cell-sub">
                            {p.species} · {p.breed}
                          </div>
                        </div>
                      </Group>
                    ),
                  },
                  {
                    key: "petOwner",
                    label: "Tutor",
                    width: "28%",
                    render: (p) => p.petOwner?.name,
                  },
                  {
                    key: "alerts",
                    label: "Alertas",
                    render: petAlerts,
                  },
                ]}
                mobile={{
                  title: (p) => `${p.name} · ${p.breed}`,
                  sub: (p) => `${p.petOwner?.name} · ${age(p.birth)}`,
                  side: (p) =>
                    p.alerts && (
                      <Text size="xs" c="red.8">
                        Alerta
                      </Text>
                    ),
                }}
                minWidth={560}
              />
            )}
          </Async>

          {total > pageSize && (
            <div className="block-foot">
              <Text size="sm" c="dimmed">
                {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)}{" "}
                de {total}
              </Text>
              <Pagination
                value={page}
                onChange={setPage}
                total={pages}
                size="sm"
              />
            </div>
          )}
        </Block>
      </div>

      <PetOwnerDrawer
        id={openPetOwner}
        onClose={() => setOpenPetOwner(null)}
        onEdit={(t) => setPetOwnerForm({ petOwner: t })}
        onAddPet={(t) => setPetForm({ petOwnerId: t.id, petOwnerName: t.name })}
        onEditPet={(p) => setPetForm({ pet: p })}
        onDelete={(kind, row) => setToDelete({ kind, row })}
      />
      <NewPatientModal
        opened={newPatient}
        onClose={() => setNewPatient(false)}
      />
      <PetOwnerModal
        opened={!!petOwnerForm}
        onClose={() => setPetOwnerForm(null)}
        petOwner={petOwnerForm?.petOwner}
      />
      <PetModal
        opened={!!petForm}
        onClose={() => setPetForm(null)}
        pet={petForm?.pet}
        petOwnerId={petForm?.petOwnerId}
        petOwnerName={petForm?.petOwnerName}
      />
      <ConfirmDialog
        opened={!!toDelete}
        onClose={() => setToDelete(null)}
        onConfirm={remove}
        loading={deleting}
        title={toDelete?.kind === "petOwner" ? "Excluir tutor" : "Excluir pet"}
      >
        {toDelete?.kind === "petOwner"
          ? `Excluir ${toDelete.row.name} e os pets cadastrados para ele? O histórico de atendimentos e pagamentos continua guardado.`
          : `Excluir ${toDelete?.row.name} da clínica? O histórico clínico continua guardado.`}
      </ConfirmDialog>
    </>
  );
}

function PetOwnerDrawer({ id, onClose, ...handlers }) {
  return (
    <Drawer opened={!!id} onClose={onClose} title="Ficha do tutor" size="lg">
      {id && <PetOwnerDetails id={id} {...handlers} />}
    </Drawer>
  );
}

function PetOwnerDetails({ id, onEdit, onAddPet, onEditPet, onDelete }) {
  const petOwner = usePetOwner(id);
  const [showCpf, setShowCpf] = useState(false);
  return (
    <Async q={petOwner}>
      {(t) => (
        <Stack gap="lg">
          <Group justify="space-between" align="flex-start">
            <Text fw={600} size="lg">
              {t.name}
            </Text>
            <Group gap="xs">
              <Button
                variant="default"
                size="xs"
                leftSection={<IconPencil size={14} />}
                onClick={() => onEdit(t)}
              >
                Editar
              </Button>
              <ActionIcon
                variant="default"
                size={30}
                color="red"
                aria-label="Excluir tutor"
                onClick={() => onDelete("petOwner", t)}
              >
                <IconTrash size={15} />
              </ActionIcon>
            </Group>
          </Group>
          <div
            style={{
              border: "1px solid var(--vc-line)",
              borderRadius: 8,
              overflow: "hidden",
            }}
          >
            <Facts
              items={[
                [
                  "CPF",
                  <Group key="cpf" gap={6} wrap="nowrap">
                    <span className="tnum">
                      {showCpf ? t.cpf : hideCpf(t.cpf)}
                    </span>
                    <ActionIcon
                      variant="subtle"
                      color="gray"
                      size="sm"
                      aria-label={showCpf ? "Ocultar CPF" : "Mostrar CPF"}
                      aria-pressed={showCpf}
                      onClick={() => setShowCpf((v) => !v)}
                    >
                      {showCpf ? (
                        <IconEyeOff size={16} />
                      ) : (
                        <IconEye size={16} />
                      )}
                    </ActionIcon>
                  </Group>,
                ],
                ["Telefone", t.phone],
              ]}
            />
            <Facts
              items={[
                ["E-mail", t.email],
                ["Endereço", t.address || null],
              ]}
            />
          </div>

          <div>
            <Group justify="space-between" mb="xs">
              <Text fw={600} size="sm">
                Pets ({t.pets.length})
              </Text>
              <Button
                variant="light"
                size="xs"
                leftSection={<IconPlus size={14} />}
                onClick={() => onAddPet(t)}
              >
                Adicionar pet
              </Button>
            </Group>
            {t.pets.length === 0 ? (
              <Empty>Nenhum pet cadastrado.</Empty>
            ) : (
              <Stack
                gap={0}
                style={{ border: "1px solid var(--vc-line)", borderRadius: 8 }}
              >
                {t.pets.map((p, i) => (
                  <Group
                    key={p.id}
                    justify="space-between"
                    p="sm"
                    wrap="nowrap"
                    style={
                      i ? { borderTop: "1px solid var(--vc-line)" } : undefined
                    }
                  >
                    <Group gap="sm" wrap="nowrap" style={{ minWidth: 0 }}>
                      <PetAvatar pet={p} size={34} />
                      <div style={{ minWidth: 0 }}>
                        <Text size="sm" fw={500}>
                          {p.name}
                        </Text>
                        <Text size="xs" c="dimmed">
                          {p.breed} · {age(p.birth)} · {kg(p.weight)}
                        </Text>
                        {p.alerts && (
                          <Text size="xs" c="red.8">
                            {p.alerts}
                          </Text>
                        )}
                      </div>
                    </Group>
                    <Group gap={4} wrap="nowrap">
                      <ActionIcon
                        variant="subtle"
                        color="gray"
                        aria-label={`Editar ${p.name}`}
                        onClick={() => onEditPet(p)}
                      >
                        <IconPencil size={16} />
                      </ActionIcon>
                      <ActionIcon
                        variant="subtle"
                        color="red"
                        aria-label={`Excluir ${p.name}`}
                        onClick={() => onDelete("pet", p)}
                      >
                        <IconTrash size={16} />
                      </ActionIcon>
                    </Group>
                  </Group>
                ))}
              </Stack>
            )}
          </div>
        </Stack>
      )}
    </Async>
  );
}
