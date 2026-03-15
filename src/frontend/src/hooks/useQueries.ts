import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  Challan,
  ManualPaymentRecord,
  UtrRecord,
  ViolationType,
  backendInterface,
} from "../backend.d";
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

export function useGetUpiId() {
  const { actor, isFetching } = useActor();
  return useQuery<string | null>({
    queryKey: ["upiId"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getUpiId();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSetUpiId() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (newUpiId: string) => {
      if (!actor) throw new Error("Actor not available");
      await actor.setUpiId(newUpiId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["upiId"] });
    },
  });
}

export function useSubmitUtr() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      challanId: bigint;
      vehicleNumber: string;
      amount: bigint;
      utr: string;
      submittedAt: string;
    }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.submitUtr(
        params.challanId,
        params.vehicleNumber,
        params.amount,
        params.utr,
        params.submittedAt,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["utrSubmissions"] });
    },
  });
}

export function useGetUtrSubmissions() {
  const { actor, isFetching } = useActor();
  return useQuery<UtrRecord[]>({
    queryKey: ["utrSubmissions"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getUtrSubmissions();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useApproveUtr() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (utrId: bigint) => {
      if (!actor) throw new Error("Actor not available");
      await actor.approveUtr(utrId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["utrSubmissions"] });
      queryClient.invalidateQueries({ queryKey: ["challans"] });
    },
  });
}

export function useRejectUtr() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (utrId: bigint) => {
      if (!actor) throw new Error("Actor not available");
      await actor.rejectUtr(utrId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["utrSubmissions"] });
    },
  });
}

export function useGetSupportNumber() {
  const { actor, isFetching } = useActor();
  return useQuery<string | null>({
    queryKey: ["supportNumber"],
    queryFn: async () => {
      if (!actor) return null;
      return (actor as unknown as backendInterface).getSupportNumber();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSetSupportNumber() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (number: string) => {
      if (!actor) throw new Error("Actor not available");
      await (actor as unknown as backendInterface).setSupportNumber(number);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["supportNumber"] });
    },
  });
}

export function useGetApiConfig() {
  const { actor, isFetching } = useActor();
  return useQuery<{
    apiKey?: string;
    apiBaseUrl?: string;
  }>({
    queryKey: ["apiConfig"],
    queryFn: async () => {
      if (!actor) return {};
      return (actor as unknown as backendInterface).getApiConfig();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSetApiConfig() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: { apiKey: string; apiBaseUrl: string }) => {
      if (!actor) throw new Error("Actor not available");
      await (actor as unknown as backendInterface).setApiConfig(
        params.apiKey,
        params.apiBaseUrl,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["apiConfig"] });
    },
  });
}

export function useGetViolationTypes() {
  const { actor, isFetching } = useActor();
  return useQuery<ViolationType[]>({
    queryKey: ["violationTypes"],
    queryFn: async () => {
      if (!actor) return [];
      return (actor as unknown as backendInterface).getViolationTypes();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAddViolationType() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: { name: string; amount: bigint }) => {
      if (!actor) throw new Error("Actor not available");
      return (actor as unknown as backendInterface).addViolationType(
        params.name,
        params.amount,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["violationTypes"] });
    },
  });
}

export function useDeleteViolationType() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("Actor not available");
      await (actor as unknown as backendInterface).deleteViolationType(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["violationTypes"] });
    },
  });
}

export function useSubmitManualPayment() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      vehicleNumber: string;
      phone: string;
      violations: string;
      totalAmount: bigint;
      utr: string;
      submittedAt: string;
    }) => {
      if (!actor) throw new Error("Actor not available");
      return (actor as unknown as backendInterface).submitManualPayment(
        params.vehicleNumber,
        params.phone,
        params.violations,
        params.totalAmount,
        params.utr,
        params.submittedAt,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["manualPayments"] });
    },
  });
}

export function useGetManualPayments() {
  const { actor, isFetching } = useActor();
  return useQuery<ManualPaymentRecord[]>({
    queryKey: ["manualPayments"],
    queryFn: async () => {
      if (!actor) return [];
      return (actor as unknown as backendInterface).getManualPayments();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useApproveManualPayment() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("Actor not available");
      await (actor as unknown as backendInterface).approveManualPayment(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["manualPayments"] });
    },
  });
}

export function useRejectManualPayment() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("Actor not available");
      await (actor as unknown as backendInterface).rejectManualPayment(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["manualPayments"] });
    },
  });
}
