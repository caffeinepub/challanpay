import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Challan } from "../backend.d";
import { useActor } from "./useActor";

export function useGetChallansByVehicle(vehicleNumber: string | null) {
  const { actor, isFetching } = useActor();
  return useQuery<Challan[]>({
    queryKey: ["challans", vehicleNumber],
    queryFn: async () => {
      if (!actor || !vehicleNumber) return [];
      return actor.getChallansByVehicle(vehicleNumber.toUpperCase());
    },
    enabled: !!actor && !isFetching && !!vehicleNumber,
  });
}

export function usePayChallan() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("Actor not available");
      await actor.payChallan(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["challans"] });
    },
  });
}

export function useSeedSampleData() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("Actor not available");
      await actor.seedSampleData();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["challans"] });
    },
  });
}
