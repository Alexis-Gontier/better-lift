import { Link } from "@tanstack/react-router";
import { CircleAlert, CircleCheck, FileUp } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
  Stepper,
  StepperContent,
  StepperIndicator,
  StepperItem,
  StepperNav,
  StepperPanel,
  StepperSeparator,
  StepperTitle,
  StepperTrigger,
} from "@/components/reui/stepper";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatNumber, formatShortDay } from "@/lib/format";
import { mockExercises } from "@/mocks/exercises";
import { mockHevyImport } from "@/mocks/hevy";

const STEPS = ["Fichier", "Correspondance", "Aperçu", "Import"];
const IGNORE = "__ignorer";

type Mapping = Record<string, string>;

const initialMapping = (): Mapping =>
  Object.fromEntries(mockHevyImport.exercises.map((e) => [e.name, e.guess ?? ""]));

function FileStep({ onFile }: { onFile: (name: string) => void }) {
  const input = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: zone de dépôt ; le bouton « Choisir un fichier » qu'elle contient fait la même chose au clavier
    <div
      data-over={over}
      onDragOver={(e) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        const file = e.dataTransfer.files[0];
        if (file) onFile(file.name);
      }}
      className="flex flex-col items-center gap-3 rounded-xl border border-dashed p-8 text-center data-[over=true]:bg-muted"
    >
      <FileUp className="size-6 text-muted-foreground" />
      <p className="text-sm">Déposez le fichier CSV exporté depuis Hevy</p>
      <p className="text-muted-foreground text-xs">
        Dans Hevy : Profil › Paramètres › Exporter et importer les données › Exporter.
      </p>
      <input
        ref={input}
        type="file"
        accept=".csv,text/csv"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onFile(file.name);
        }}
      />
      <div className="flex gap-2">
        <Button variant="outline" onClick={() => input.current?.click()}>
          Choisir un fichier
        </Button>
        <Button variant="ghost" onClick={() => onFile("workout_data.csv")}>
          Utiliser un exemple
        </Button>
      </div>
    </div>
  );
}

function MappingStep({
  mapping,
  setMapping,
}: {
  mapping: Mapping;
  setMapping: (m: Mapping) => void;
}) {
  const unresolved = Object.values(mapping).filter((v) => v === "").length;
  return (
    <div className="flex flex-col gap-3">
      <p className="text-muted-foreground text-sm">
        {mockHevyImport.exercises.length} exercices trouvés.{" "}
        {unresolved > 0
          ? `${unresolved} sans correspondance : choisissez un exercice, créez-le ou ignorez-le.`
          : "Tous ont une correspondance."}
      </p>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Exercice Hevy</TableHead>
            <TableHead className="text-right">Séries</TableHead>
            <TableHead>Dans better-lift</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {mockHevyImport.exercises.map((e) => {
            const value = mapping[e.name] ?? "";
            return (
              <TableRow key={e.name}>
                <TableCell>
                  <span className="flex items-center gap-2">
                    {value === "" && <CircleAlert className="size-4 shrink-0 text-destructive" />}
                    {e.name}
                  </span>
                </TableCell>
                <TableCell className="text-right tabular-nums">{e.sets}</TableCell>
                <TableCell>
                  <Select
                    value={value}
                    onValueChange={(v) => setMapping({ ...mapping, [e.name]: v })}
                  >
                    <SelectTrigger className="w-60" aria-label={`Correspondance de ${e.name}`}>
                      <SelectValue placeholder="Choisir…" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {mockExercises.map((x) => (
                          <SelectItem key={x.slug} value={x.slug}>
                            {x.name}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                      <SelectSeparator />
                      <SelectGroup>
                        <SelectItem value={IGNORE}>Ignorer cet exercice</SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

function PreviewStep({ fileName, mapping }: { fileName: string; mapping: Mapping }) {
  const kept = mockHevyImport.exercises.filter((e) => mapping[e.name] !== IGNORE);
  const sets = kept.reduce((n, e) => n + e.sets, 0);
  const items = [
    { label: "Séances", value: formatNumber(mockHevyImport.sessions) },
    {
      label: "Période",
      value: `${formatShortDay(mockHevyImport.from)} ${mockHevyImport.from.slice(0, 4)} → ${formatShortDay(mockHevyImport.to)} ${mockHevyImport.to.slice(0, 4)}`,
    },
    { label: "Séries", value: formatNumber(sets) },
    { label: "Exercices", value: formatNumber(kept.length) },
  ];
  return (
    <div className="flex flex-col gap-4">
      <p className="text-muted-foreground text-sm">
        Fichier <span className="font-medium text-foreground">{fileName}</span>. Rien n'est encore
        importé.
      </p>
      <div className="grid grid-cols-2 gap-4 @xl:grid-cols-4">
        {items.map((i) => (
          <div key={i.label} className="flex flex-col gap-0.5 rounded-lg border p-3">
            <span className="text-muted-foreground text-xs">{i.label}</span>
            <span className="font-semibold tabular-nums">{i.value}</span>
          </div>
        ))}
      </div>
      {kept.length < mockHevyImport.exercises.length && (
        <p className="text-muted-foreground text-sm">
          {mockHevyImport.exercises.length - kept.length} exercice(s) ignoré(s) : leurs séries ne
          seront pas importées.
        </p>
      )}
    </div>
  );
}

function ImportStep({ onDone }: { onDone: () => void }) {
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    if (progress >= 100) {
      onDone();
      return;
    }
    const t = window.setTimeout(() => setProgress((p) => Math.min(100, p + 12)), 180);
    return () => window.clearTimeout(t);
  }, [progress, onDone]);
  return (
    <div className="flex flex-col gap-3">
      {progress < 100 ? (
        <>
          <p className="text-sm">
            Import des séances… {Math.round((progress / 100) * mockHevyImport.sessions)} /{" "}
            {mockHevyImport.sessions}
          </p>
          <Progress value={progress} />
        </>
      ) : (
        <div className="flex flex-col items-center gap-3 py-6 text-center">
          <CircleCheck className="size-8" />
          <p className="font-medium">{mockHevyImport.sessions} séances importées</p>
          <p className="text-muted-foreground text-sm">
            Les records et la progression ont été recalculés.
          </p>
          <Button asChild>
            <Link to="/history">Voir l'historique</Link>
          </Button>
        </div>
      )}
    </div>
  );
}

/** Parcours d'import Hevy : fichier → correspondance → aperçu → import (simulé). */
export function HevyImport() {
  const [step, setStep] = useState(1);
  const [fileName, setFileName] = useState<string | null>(null);
  const [mapping, setMapping] = useState<Mapping>(initialMapping);
  const [done, setDone] = useState(false);

  const unresolved = Object.values(mapping).some((v) => v === "");
  const canGo = (target: number) =>
    !done &&
    step !== 4 &&
    (target <= step ||
      (target === 2 && fileName !== null) ||
      (target === 3 && fileName !== null && !unresolved));

  return (
    <Stepper
      value={step}
      onValueChange={(s) => canGo(s) && setStep(s)}
      className="flex flex-col gap-6"
    >
      <StepperNav>
        {STEPS.map((title, i) => (
          <StepperItem key={title} step={i + 1} completed={step > i + 1 || (done && i === 3)}>
            <StepperTrigger className="flex items-center gap-2" disabled={!canGo(i + 1)}>
              <StepperIndicator>{i + 1}</StepperIndicator>
              <StepperTitle>{title}</StepperTitle>
            </StepperTrigger>
            {i < STEPS.length - 1 && <StepperSeparator className="mx-3" />}
          </StepperItem>
        ))}
      </StepperNav>

      <StepperPanel>
        <StepperContent value={1}>
          <FileStep
            onFile={(name) => {
              setFileName(name);
              setStep(2);
            }}
          />
        </StepperContent>
        <StepperContent value={2}>
          <MappingStep mapping={mapping} setMapping={setMapping} />
        </StepperContent>
        <StepperContent value={3}>
          <PreviewStep fileName={fileName ?? ""} mapping={mapping} />
        </StepperContent>
        <StepperContent value={4}>
          <ImportStep onDone={() => setDone(true)} />
        </StepperContent>
      </StepperPanel>

      {step > 1 && step < 4 && (
        <div className="flex items-center justify-between gap-2">
          <Button variant="outline" onClick={() => setStep(step - 1)}>
            Retour
          </Button>
          <div className="flex items-center gap-3">
            {step === 2 && unresolved && (
              <Badge variant="outline" className="gap-1">
                <CircleAlert className="size-3" /> Correspondances à compléter
              </Badge>
            )}
            <Button disabled={step === 2 && unresolved} onClick={() => setStep(step + 1)}>
              {step === 3 ? "Importer" : "Suivant"}
            </Button>
          </div>
        </div>
      )}
    </Stepper>
  );
}
