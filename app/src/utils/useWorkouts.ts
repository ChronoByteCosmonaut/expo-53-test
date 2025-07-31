import { useInfiniteQuery } from "@tanstack/react-query";
import { supabase } from "./supabase";

const WORKOUTS_PER_PAGE = 8;

const fetchWorkouts = async ({ pageParam }: { pageParam?: string }) => {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("User not authenticated");
  }

  let query = supabase
    .from("workouts")
    .select("*", { count: "exact" })
    .eq("created_by", user.id)
    .order("created_at", { ascending: false })
    .limit(WORKOUTS_PER_PAGE);

  // If we have a cursor (pageParam), fetch records older than this timestamp
  if (pageParam) {
    query = query.lt("created_at", pageParam);
  }

  const { data, error, count } = await query;

  if (error) {
    throw new Error(error.message);
  }

  // Get the cursor for the next page (created_at of the last item)
  const nextCursor =
    data && data.length === WORKOUTS_PER_PAGE
      ? data[data.length - 1].created_at
      : undefined;

  return {
    workouts: data || [],
    nextCursor,
    totalCount: count,
  };
};

// Custom hook for workouts
export const useWorkouts = () => {
  return useInfiniteQuery({
    queryKey: ["workouts"],
    queryFn: fetchWorkouts,
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage: { nextCursor?: string }) =>
      lastPage.nextCursor,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};

// OFFSET PAGINATION

// import { useInfiniteQuery } from "@tanstack/react-query";
// import { supabase } from "./supabase";
// const WORKOUTS_PER_PAGE = 8;

// const fetchWorkouts = async ({ pageParam = 0 }: { pageParam?: number }) => {
//   const {
//     data: { user },
//   } = await supabase.auth.getUser();

//   if (!user) {
//     throw new Error("User not authenticated");
//   }

//   const from = pageParam * WORKOUTS_PER_PAGE;
//   const to = from + WORKOUTS_PER_PAGE - 1;

//   const { data, error, count } = await supabase
//     .from("workouts")
//     .select("*", { count: "exact" })
//     .eq("created_by", user.id)
//     .order("created_at", { ascending: false })
//     .range(from, to);

//   if (error) {
//     throw new Error(error.message);
//   }

//   return {
//     workouts: data,
//     nextPage: data.length === WORKOUTS_PER_PAGE ? pageParam + 1 : undefined,
//     totalCount: count,
//   };
// };

// // Custom hook for workouts
// export const useWorkouts = () => {
//   return useInfiniteQuery({
//     queryKey: ["workouts"],
//     queryFn: fetchWorkouts, // Type assertion to satisfy TS, or update fetchWorkouts signature as below
//     initialPageParam: 0,
//     getNextPageParam: (lastPage: { nextPage?: number }) => lastPage.nextPage,
//     staleTime: 5 * 60 * 1000, // 5 minutes
//     gcTime: 10 * 60 * 1000, // 10 minutes
//   });
// };
