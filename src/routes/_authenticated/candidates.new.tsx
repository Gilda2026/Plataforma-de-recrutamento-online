import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";

import {
  Search,
  Eye,
  Brain,
} from "lucide-react";

import {
  listRecruitmentCandidates,
  analyzeCandidateProfile,
} from "@/lib/recruitment.functions.server";

import { listContests } from "@/lib/contests.functions.server";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

import {
  Card,
  CardContent,
} from "@/components/ui/card";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute(
  "/_authenticated/candidates/new"
)({
  component: CandidatesNewPage,
});

function CandidatesNewPage() {

  console.log("COMPONENT RENDER");

  const navigate = useNavigate();

  const queryClient =
    useQueryClient();

  // =========================
  // SERVER FUNCTIONS
  // =========================

  const getCandidates =
    useServerFn(
      listRecruitmentCandidates
    );

  const analyzeFn =
    useServerFn(
      analyzeCandidateProfile
    );

  const contestsFn =
    useServerFn(
      listContests
    );

  // =========================
  // STATES
  // =========================

  const [q, setQ] =
    useState("");

  const [contestId, setContestId] =
    useState("");

  const [careerId, setCareerId] =
    useState("");

  const [
    occupationId,
    setOccupationId,
  ] = useState("");

  const [
    analyzingId,
    setAnalyzingId,
  ] = useState("");

  const [
    analyzingAll,
    setAnalyzingAll,
  ] = useState(false);

  console.log({
    contestId,
    careerId,
    occupationId,
  });

  // =========================
  // CONTESTS
  // =========================

  const {
    data: contestsData,
    error: contestsError,
  } = useQuery({
    queryKey: ["contests"],

    queryFn: async () => {

      console.log(
        "LOADING CONTESTS"
      );

      const result =
        await contestsFn();

      console.log(
        "CONTESTS RESULT",
        result
      );

      return result;
    },
  });

  console.log(
    "CONTESTS ERROR",
    contestsError
  );

  const contests =
    (contestsData as any)
      ?.contests ?? [];

  // =========================
  // CANDIDATES
  // =========================

  console.log(
    "BEFORE QUERY"
  );

//   const {
//   data,
//   isLoading,
//   error,
// } = useQuery({
//   enabled: !!contestId,

//   queryKey: [
//     "recruitment-candidates",
//     contestId,
//     careerId,
//     occupationId,
//     q,
//   ],

//   queryFn: async () => {

//     console.log(
//       "QUERY RUNNING"
//     );

//     const result =
//       await getCandidates({
//         data: {
//           contestId:
//             contestId ||
//             undefined,

//           careerId:
//             careerId ||
//             undefined,

//           occupationId:
//             occupationId ||
//             undefined,

//           search:
//             q || undefined,
//         },
//       });

//     console.log(
//       "SERVER RESULT",
//       result
//     );

//     return result;
//   },
// });

//   console.log(
//     "RAW DATA",
//     data
//   );

//   console.log(
//     "QUERY ERROR",
//     error
//   );

const { data, isLoading } = useQuery({
  queryKey: ["recruitment-candidates", contestId, careerId, occupationId, q],
  queryFn: async () => {
    if (!contestId) return { candidates: [] };

    return getCandidates({
      data: {
        contestId,
        careerId: careerId || undefined,
        occupationId: occupationId || undefined,
        search: q || undefined,
      },
    });
  },
});

  const candidates =
  contestId
    ? ((data as any)?.candidates ?? [])
    : [];

  // =========================
  // FILTERED
  // =========================

  const filtered =
    useMemo(() => {

      const search =
        q.trim()
          .toLowerCase();

      return candidates.filter(
        (candidate: any) => {

          const matchContest =
            !contestId ||
            String(
              candidate.contest_id
            ) ===
              String(
                contestId
              );

          const matchCareer =
            !careerId ||
            String(
              candidate.career_id
            ) ===
              String(
                careerId
              );

          const matchOccupation =
            !occupationId ||
            String(
              candidate.occupation_id
            ) ===
              String(
                occupationId
              );

          const matchSearch =
            !search ||
            (
              candidate.full_name ??
              ""
            )
              .toLowerCase()
              .includes(
                search
              ) ||
            (
              candidate.phone ??
              ""
            )
              .toLowerCase()
              .includes(
                search
              ) ||
            (
              candidate.doc_number ??
              ""
            )
              .toLowerCase()
              .includes(
                search
              );

          return (
            matchContest &&
            matchCareer &&
            matchOccupation &&
            matchSearch
          );
        }
      );
    }, [
      candidates,
      contestId,
      careerId,
      occupationId,
      q,
    ]);

  // =========================
  // CAREERS
  // =========================

  const careers =
    useMemo(() => {

      const map =
        new Map();

      candidates
        .filter(
          (c: any) => {
            return (
              !contestId ||
              String(
                c.contest_id
              ) ===
                String(
                  contestId
                )
            );
          }
        )
        .forEach(
          (c: any) => {

            if (
              c.career_id &&
              c.career_name
            ) {
              map.set(
                c.career_id,
                {
                  id: String(
                    c.career_id
                  ),

                  name:
                    c.career_name,
                }
              );
            }
          }
        );

      return Array.from(
        map.values()
      );
    }, [
      candidates,
      contestId,
    ]);

  const occupations =
    useMemo(() => {

      const map =
        new Map();

      candidates
        .filter(
          (c: any) => {
            return (
              (!contestId ||
                String(
                  c.contest_id
                ) ===
                  String(
                    contestId
                  )) &&
              (!careerId ||
                String(
                  c.career_id
                ) ===
                  String(
                    careerId
                  ))
            );
          }
        )
        .forEach(
          (c: any) => {

            if (
              c.occupation_id &&
              c.occupation_name
            ) {
              map.set(
                c.occupation_id,
                {
                  id: String(
                    c.occupation_id
                  ),

                  name:
                    c.occupation_name,
                }
              );
            }
          }
        );

      return Array.from(
        map.values()
      );
    }, [
      candidates,
      contestId,
      careerId,
    ]);

  // =========================
  // ACTIONS
  // =========================

  const analyzeCandidate =
    async (
      applicationId: string
    ) => {

      setAnalyzingId(
        applicationId
      );

      try {

        await analyzeFn({
          data: {
            applicationId,
          },
        });

        await queryClient.invalidateQueries(
          {
            queryKey: [
              "recruitment-candidates",
            ],
          }
        );
        await queryClient.refetchQueries({
  queryKey: ["candidate"],
  type: "active",
});
      } finally {

        setAnalyzingId(
          ""
        );
      }
    };

  const analyzeAll = async () => {
  setAnalyzingAll(true);

  try {
    await Promise.all(
      filtered.map((candidate: any) =>
        analyzeFn({
          data: {
            applicationId: candidate.application_id,
          },
        })
      )
    );

    await queryClient.invalidateQueries({
      queryKey: ["recruitment-candidates"],
    });
  } finally {
    setAnalyzingAll(false);
  }
};
const viewProfile = (id: string) => {
  navigate({
    to: "/candidates/$id/resume",
    params: { id },
  });
};

  // =========================
  // UI
  // =========================

  return (
    <div className="space-y-6">

      <header>
        <h1 className="text-3xl font-bold">
          Gestão de candidatos
        </h1>
      </header>

      {/* FILTERS */}

      {/* FILTERS */}

<Card>
  <CardContent className="grid gap-4 p-5 md:grid-cols-4">

    {/* CONTEST */}
    <Select
      value={contestId}
      onValueChange={(value) => {
        setContestId(value);
        setCareerId("");
        setOccupationId("");
      }}
    >
      <SelectTrigger>
        <SelectValue placeholder="Concurso" />
      </SelectTrigger>

      <SelectContent>
        {contests.map((contest: any) => (
          <SelectItem
            key={String(contest.id)}
            value={String(contest.id)}
          >
            {contest.designation}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>

   {/* CAREER */}
<Select
  value={careerId}
  disabled={!contestId}
  onValueChange={(value) => {
    setCareerId(value);
    setOccupationId("");
  }}
>
  <SelectTrigger>
    <SelectValue placeholder="Carreira" />
  </SelectTrigger>

  <SelectContent>
    {careers.map((career: any) => (
      <SelectItem
        key={String(career.id)}
        value={String(career.id)}
      >
        {career.name}
      </SelectItem>
    ))}
  </SelectContent>
</Select>

{/* OCCUPATION */}
<Select
  value={occupationId}
  disabled={!contestId || !careerId}
  onValueChange={setOccupationId}
>
  <SelectTrigger>
    <SelectValue placeholder="Ocupação" />
  </SelectTrigger>

  <SelectContent>
    {occupations.map((occupation: any) => (
      <SelectItem
        key={String(occupation.id)}
        value={String(occupation.id)}
      >
        {occupation.name}
      </SelectItem>
    ))}
  </SelectContent>
</Select>

    {/* SEARCH */}
    <div className="relative">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

     <Input
  disabled={!contestId}
  className="pl-9"
  placeholder="Pesquisar..."
  value={q}
  onChange={(e) =>
    setQ(e.target.value)
  }
/>
    </div>

  </CardContent>
</Card>

{/* ACTIONS */}

<div className="flex justify-end">
  <Button
    onClick={analyzeAll}
    disabled={
      analyzingAll || !contestId
    }
  >
    <Brain className="mr-2 h-4 w-4" />

    {analyzingAll
      ? "A analisar..."
      : "Analisar todos"}
  </Button>
</div>

{/* TABLE */}

<Card>
  <CardContent className="p-0">

    {!contestId ? (

      <div className="p-10 text-center text-muted-foreground">
        Selecione um concurso
      </div>

    ) : isLoading ? (

      <div className="p-10 text-center">
        A carregar...
      </div>

    ) : filtered.length === 0 ? (

      <div className="p-10 text-center text-muted-foreground">
        Nenhum candidato encontrado
      </div>

    ) : (

      <Table>

        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Contacto</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead>Score</TableHead>
            <TableHead className="text-right">
              Ações
            </TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>

          {filtered.map((candidate: any) => (
            <TableRow
              key={candidate.application_id}
            >
              <TableCell>
                {candidate.full_name}
              </TableCell>

              <TableCell>
                {candidate.phone}
              </TableCell>
              
              <TableCell>
                {candidate.status ?? "-"}
              </TableCell>

              <TableCell>
                {candidate.score ?? "-"}
              </TableCell>

              

              <TableCell className="flex justify-end gap-2">

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    viewProfile(
                      candidate.application_id
                    )
                  }
                >
                  <Eye className="mr-2 h-4 w-4" />
                  Ver
                </Button>

                <Button
                  size="sm"
                  onClick={() =>
                    analyzeCandidate(
                      candidate.application_id
                    )
                  }
                  disabled={
                    analyzingId ===
                    candidate.application_id
                  }
                >
                  <Brain className="mr-2 h-4 w-4" />

                  {analyzingId ===
                  candidate.application_id
                    ? "..."
                    : "IA"}
                </Button>

              </TableCell>
            </TableRow>
          ))}

        </TableBody>

      </Table>

    )}

  </CardContent>
</Card>
  

      {/* ACTIONS */}

      
    </div>
  );
}