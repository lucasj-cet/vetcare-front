import {
  ActionIcon,
  Button,
  Drawer,
  Group,
  Menu,
  Pagination,
  Stack,
  Tabs,
  Text,
  TextInput,
} from "@mantine/core";
import { useDebouncedValue } from "@mantine/hooks";
import {
  IconDots,
  IconPencil,
  IconPlus,
  IconSearch,
  IconTrash,
} from "@tabler/icons-react";
import {
  debounce,
  parseAsInteger,
  parseAsString,
  parseAsStringLiteral,
  useQueryState,
} from "nuqs";
import { useState } from "react";
import { api } from "../../api";
import { usePetOwner, usePetOwners } from "../../api/queries/petOwners";
import { usePets } from "../../api/queries/pets";
import { PetModal, PetOwnerModal } from "../../components/PeopleForms";
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
import { useSubmit } from "../../hooks/useApi";
import { age, kg } from "../../lib/format";
import { act } from "../../lib/notify";

const TABS = ["tutores", "pacientes"];

export default function Cadastros() {
  const [tab, setTab] = useQueryState(
    "tab",
    parseAsStringLiteral(TABS).withDefault("tutores"),
  );
  const [search, setSearch] = useQueryState(
    "q",
    parseAsString.withDefault("").withOptions({
      history: "replace",
      limitUrlUpdates: debounce(500),
    }),
  );
  const [debounced] = useDebouncedValue(search, 500);
  const [page, setPage] = useQueryState("page", parseAsInteger.withDefault(1));
  const [petOwnerForm, setPetOwnerForm] = useState(null); // { petOwner? }
  const [petForm, setPetForm] = useState(null); // { pet?, petOwnerId, petOwnerName }
  const [openPetOwner, setOpenPetOwner] = useState(null);
  const [toDelete, setToDelete] = useState(null); // { kind, row }
  const [deleting, submit] = useSubmit();

  const petOwners = usePetOwners({
    search: debounced,
    page,
    enabled: tab === "tutores",
  });
  const ownersTotal = usePetOwners().data?.total;
  const pets = usePets({
    search: debounced,
    page,
    enabled: tab === "pacientes",
  });
  const petsTotal = usePets().data?.total;

  const current = tab === "tutores" ? petOwners : pets;
  const total = current.data?.total ?? 0;
  const pageSize = current.data?.pageSize;
  const pages =
    total && pageSize ? Math.max(1, Math.ceil(total / pageSize)) : null;
  const petOwnerRows = petOwners.data?.rows ?? [];
  const petRows = pets.data?.rows ?? [];

  const remove = () =>
    submit(async () => {
      const { kind, row } = toDelete;
      const ok = await act(
        kind === "petOwner"
          ? api.petOwners.remove(row.id)
          : api.pets.remove(row.id),
        `${row.name} foi excluído.`,
      );
      if (ok) {
        setToDelete(null);
        if (kind === "petOwner") setOpenPetOwner(null);
      }
    });

  const rowMenu = (items) => (
    <Menu position="bottom-end" withinPortal>
      <Menu.Target>
        <ActionIcon
          variant="subtle"
          color="gray"
          aria-label="Ações"
          onClick={(e) => e.stopPropagation()}
        >
          <IconDots size={16} />
        </ActionIcon>
      </Menu.Target>
      <Menu.Dropdown onClick={(e) => e.stopPropagation()}>
        {items.map((i) => (
          <Menu.Item
            key={i.label}
            leftSection={<i.icon size={15} />}
            color={i.color}
            onClick={i.onClick}
          >
            {i.label}
          </Menu.Item>
        ))}
      </Menu.Dropdown>
    </Menu>
  );

  return (
    <>
      <PageHeader title="Cadastros" finding="Tutores e pacientes da clínica">
        <Button
          leftSection={<IconPlus size={16} />}
          onClick={() => setPetOwnerForm({})}
        >
          Novo cadastro
        </Button>
      </PageHeader>

      <div className="stack">
        <Kpis
          items={[
            { label: "Tutores", value: ownersTotal ?? "—" },
            { label: "Pacientes", value: petsTotal ?? "—" },
          ]}
        />

        <Block flush>
          <Tabs
            value={tab}
            onChange={(t) => {
              setTab(t);
              setPage(1);
            }}
          >
            <Group
              justify="space-between"
              px="lg"
              pt="sm"
              gap="sm"
              wrap="wrap"
              style={{ borderBottom: "1px solid var(--vc-line)" }}
            >
              <Tabs.List style={{ border: 0, marginBottom: -1 }}>
                <Tabs.Tab value="tutores">Tutores</Tabs.Tab>
                <Tabs.Tab value="pacientes">Pacientes</Tabs.Tab>
              </Tabs.List>
              <TextInput
                leftSection={<IconSearch size={15} />}
                placeholder={
                  tab === "tutores"
                    ? "Nome, CPF, telefone ou pet"
                    : "Nome, raça ou tutor"
                }
                value={search}
                onChange={(e) => {
                  setSearch(e.currentTarget.value);
                  setPage(1);
                }}
                w={{ base: "100%", sm: 300 }}
                mb="sm"
                aria-label="Buscar"
              />
            </Group>
          </Tabs>

          <Async q={tab === "tutores" ? petOwners : pets} rows={6}>
            {() =>
              tab === "tutores" ? (
                <DataTable
                  rows={petOwnerRows}
                  empty={
                    search
                      ? `Nenhum tutor encontrado para "${search}".`
                      : "Nenhum tutor cadastrado."
                  }
                  onRowClick={(t) => setOpenPetOwner(t.id)}
                  columns={[
                    {
                      key: "name",
                      label: "Tutor",
                      render: (t) => (
                        <>
                          <div className="cell-main">{t.name}</div>
                          <div className="cell-sub">{t.email}</div>
                        </>
                      ),
                    },
                    {
                      key: "cpf",
                      label: "CPF",
                      render: (t) => <span className="tnum">{t.cpf}</span>,
                    },
                    {
                      key: "phone",
                      label: "Telefone",
                      render: (t) => <span className="tnum">{t.phone}</span>,
                    },
                    {
                      key: "pets",
                      label: "Pacientes",
                      render: (t) =>
                        t.pets.length ? (
                          t.pets.map((p) => p.name).join(", ")
                        ) : (
                          <span className="faint">—</span>
                        ),
                    },
                    {
                      key: "act",
                      label: "",
                      width: 48,
                      render: (t) =>
                        rowMenu([
                          {
                            label: "Editar tutor",
                            icon: IconPencil,
                            onClick: () => setPetOwnerForm({ petOwner: t }),
                          },
                          {
                            label: "Adicionar pet",
                            icon: IconPlus,
                            onClick: () =>
                              setPetForm({
                                petOwnerId: t.id,
                                petOwnerName: t.name,
                              }),
                          },
                          {
                            label: "Excluir",
                            icon: IconTrash,
                            color: "red",
                            onClick: () =>
                              setToDelete({ kind: "petOwner", row: t }),
                          },
                        ]),
                    },
                  ]}
                  mobile={{
                    title: (t) => t.name,
                    sub: (t) =>
                      `${t.phone} · ${t.pets.map((p) => p.name).join(", ") || "sem pets"}`,
                  }}
                />
              ) : (
                <DataTable
                  rows={petRows}
                  empty={
                    search
                      ? `Nenhum paciente encontrado para "${search}".`
                      : "Nenhum paciente cadastrado."
                  }
                  onRowClick={(p) => setOpenPetOwner(p.petOwnerId)}
                  columns={[
                    {
                      key: "name",
                      label: "Paciente",
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
                      render: (p) => p.petOwner?.name,
                    },
                    { key: "age", label: "Idade", render: (p) => age(p.birth) },
                    {
                      key: "weight",
                      label: "Peso",
                      num: true,
                      render: (p) => kg(p.weight),
                    },
                    {
                      key: "alerts",
                      label: "Alertas",
                      render: (p) =>
                        p.alerts ? (
                          <Text size="sm" c="red.8">
                            {p.alerts}
                          </Text>
                        ) : (
                          <span className="faint">—</span>
                        ),
                    },
                    {
                      key: "act",
                      label: "",
                      width: 48,
                      render: (p) =>
                        rowMenu([
                          {
                            label: "Editar pet",
                            icon: IconPencil,
                            onClick: () => setPetForm({ pet: p }),
                          },
                          {
                            label: "Excluir",
                            icon: IconTrash,
                            color: "red",
                            onClick: () => setToDelete({ kind: "pet", row: p }),
                          },
                        ]),
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
                  minWidth={820}
                />
              )
            }
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
          : `Excluir ${toDelete?.row.name} dos cadastros? O histórico clínico continua guardado.`}
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
                ["CPF", t.cpf],
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
