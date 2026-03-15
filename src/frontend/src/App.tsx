import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Toaster } from "@/components/ui/sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  AlertCircle,
  Calendar,
  Car,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  Copy,
  ExternalLink,
  IndianRupee,
  Loader2,
  MapPin,
  Phone,
  Radio,
  Search,
  Shield,
  Smartphone,
  Tag,
  User,
  Zap,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AdminApp } from "./AdminApp";
import type { Challan } from "./backend.d";
import { Status } from "./backend.d";
import {
  useGetApiConfig,
  useGetChallansByVehicle,
  useGetSupportNumber,
  useGetUpiId,
  useGetViolationTypes,
  usePayChallan,
  useSubmitManualPayment,
  useSubmitUtr,
} from "./hooks/useQueries";

const queryClient = new QueryClient();

const EXAMPLE_VEHICLES = ["MH12AB1234", "DL3CAF9087", "KA05MG7654"];

function formatCurrency(amount: bigint): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(amount));
}

function getViolationIcon(type: string) {
  const lower = type.toLowerCase();
  if (lower.includes("speed")) return "🚦";
  if (lower.includes("red") || lower.includes("signal")) return "🔴";
  if (lower.includes("park")) return "🅿️";
  if (lower.includes("belt") || lower.includes("seatbelt")) return "🛡️";
  if (lower.includes("phone") || lower.includes("mobile")) return "📱";
  return "⚠️";
}

// Map flexible API response fields to our Challan type
function mapApiResponseToChallan(
  item: Record<string, unknown>,
  index: number,
): Challan {
  const fineAmount = BigInt(
    Math.round(
      Number(item.fine_amount ?? item.fineAmount ?? item.amount ?? 500),
    ),
  );
  const discountedAmount = BigInt(Math.round(Number(fineAmount) * 0.7));
  return {
    id: BigInt(index + 1),
    vehicleNumber: String(item.vehicle_number ?? item.vehicleNumber ?? ""),
    violationType: String(
      item.violation_type ??
        item.violationType ??
        item.violation ??
        "Traffic Violation",
    ),
    fineAmount,
    discountedAmount,
    date: String(
      item.date ?? item.challan_date ?? new Date().toISOString().split("T")[0],
    ),
    location: String(item.location ?? item.place ?? "Unknown"),
    officerName: String(
      item.officer_name ??
        item.officerName ??
        item.officer ??
        "Traffic Officer",
    ),
    status: Status.pending,
  };
}

function UpiPayButton({
  upiId,
  amount,
  note,
}: {
  upiId: string;
  amount: number | bigint;
  note?: string;
}) {
  const [showFallback, setShowFallback] = useState(false);
  const amountNum = Number(amount);
  const upiLink = `upi://pay?pa=${encodeURIComponent(upiId)}&am=${amountNum}&cu=INR&tn=${encodeURIComponent(note || "ChallanPay")}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(`upi://pay?pa=${upiId}&am=${amountNum}&cu=INR`)}&size=200x200`;

  const handlePayNow = () => {
    window.location.href = upiLink;
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(upiId);
    toast.success("UPI ID copied!");
  };

  return (
    <div className="space-y-3">
      <Button
        className="w-full gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold"
        onClick={handlePayNow}
        data-ocid="payment.upi_deeplink_button"
      >
        <Smartphone className="w-4 h-4" />
        Pay via UPI Apps
        <span className="text-xs opacity-80 font-normal ml-1">
          ({formatCurrency(BigInt(amountNum))})
        </span>
      </Button>

      <button
        type="button"
        className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center gap-1"
        onClick={() => setShowFallback((v) => !v)}
      >
        <ChevronDown
          className={`w-3 h-3 transition-transform ${showFallback ? "rotate-180" : ""}`}
        />
        {showFallback ? "Hide" : "Can't open app? Show QR / copy UPI ID"}
      </button>

      {showFallback && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="bg-muted/40 border border-border rounded-xl p-4 space-y-3"
        >
          <div className="flex flex-col items-center gap-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Scan to Pay
            </p>
            <img
              src={qrUrl}
              alt="UPI QR Code"
              className="w-40 h-40 rounded-lg border border-border"
              data-ocid="payment.upi_qr_code"
            />
          </div>
          <div className="flex items-center justify-between gap-2 bg-background border border-border rounded-lg px-3 py-2">
            <span className="font-mono text-sm text-foreground truncate flex-1">
              {upiId}
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-primary hover:text-primary shrink-0"
              onClick={handleCopy}
              data-ocid="payment.upi_copy_button"
            >
              <Copy className="w-3.5 h-3.5" />
            </Button>
          </div>
        </motion.div>
      )}
    </div>
  );
}

function PaymentModal({
  challan,
  open,
  onClose,
}: {
  challan: Challan | null;
  open: boolean;
  onClose: () => void;
}) {
  const [utrInput, setUtrInput] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const { data: upiId, isLoading: upiLoading } = useGetUpiId();
  const { mutate: submitUtr, isPending: isSubmitting } = useSubmitUtr();

  if (!challan) return null;

  const savings = challan.fineAmount - challan.discountedAmount;
  const discountPct = Math.round(
    (Number(savings) / Number(challan.fineAmount)) * 100,
  );

  const handleClose = () => {
    setUtrInput("");
    setSubmitted(false);
    onClose();
  };

  const handleSubmitUtr = () => {
    const trimmed = utrInput.trim();
    if (!trimmed) {
      toast.error("Please enter your UTR number");
      return;
    }
    if (trimmed.length < 6) {
      toast.error("UTR number seems too short. Please check and re-enter.");
      return;
    }
    submitUtr(
      {
        challanId: challan.id,
        vehicleNumber: challan.vehicleNumber,
        amount: challan.discountedAmount,
        utr: trimmed,
        submittedAt: new Date().toISOString(),
      },
      {
        onSuccess: () => {
          setSubmitted(true);
          toast.success("UTR submitted for verification!");
        },
        onError: () => {
          toast.error("Submission failed. Please try again.");
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="max-w-md" data-ocid="payment.dialog">
        <AnimatePresence mode="wait">
          {submitted ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center py-8 gap-4"
              data-ocid="payment.success_state"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{
                  type: "spring",
                  stiffness: 260,
                  damping: 20,
                  delay: 0.1,
                }}
                className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center"
              >
                <CheckCircle2 className="w-10 h-10 text-success" />
              </motion.div>
              <div className="text-center">
                <h3 className="font-display font-bold text-2xl text-foreground mb-1">
                  Payment Under Review!
                </h3>
                <p className="text-muted-foreground text-sm">
                  We'll confirm once your UTR is verified.
                </p>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 w-full">
                <p className="text-xs font-semibold text-blue-800 mb-1">
                  What happens next?
                </p>
                <ul className="text-xs text-blue-700 space-y-1">
                  <li>• Our team will verify your UTR number</li>
                  <li>• Challan status will be updated within 24 hours</li>
                  <li>• You'll receive confirmation on approval</li>
                </ul>
              </div>
              <Button
                onClick={handleClose}
                className="w-full"
                data-ocid="payment.close_button"
              >
                Done
              </Button>
            </motion.div>
          ) : (
            <motion.div
              key="payment"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col gap-5"
            >
              <DialogHeader>
                <DialogTitle className="font-display text-xl">
                  Pay via Paytm UPI
                </DialogTitle>
              </DialogHeader>

              {/* Challan summary */}
              <div className="bg-muted/60 rounded-xl p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">
                    {getViolationIcon(challan.violationType)}
                  </span>
                  <div>
                    <p className="font-semibold text-foreground">
                      {challan.violationType}
                    </p>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> {challan.location}
                    </p>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> {challan.date}
                    </p>
                  </div>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-xs text-muted-foreground line-through">
                      {formatCurrency(challan.fineAmount)}
                    </p>
                    <p className="font-display font-bold text-xl text-primary">
                      {formatCurrency(challan.discountedAmount)}
                    </p>
                  </div>
                  <Badge className="bg-green-600 hover:bg-green-600 text-white text-xs font-bold">
                    {discountPct}% OFF
                  </Badge>
                </div>
              </div>

              {/* UPI ID display */}
              {upiLoading ? (
                <div className="flex items-center gap-2 py-2">
                  <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    Loading payment details...
                  </span>
                </div>
              ) : !upiId ? (
                <div
                  className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-center"
                  data-ocid="payment.upi_display"
                >
                  <AlertCircle className="w-6 h-6 text-amber-500 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-amber-800">
                    Payment not available at the moment.
                  </p>
                  <p className="text-xs text-amber-700 mt-1">
                    Please contact admin to configure payment.
                  </p>
                </div>
              ) : (
                <>
                  <UpiPayButton
                    upiId={upiId}
                    amount={challan.discountedAmount}
                    note={`ChallanPay - ${challan.vehicleNumber}`}
                  />

                  {/* UTR input */}
                  <div className="space-y-2">
                    <label
                      htmlFor="utr-input"
                      className="text-sm font-semibold text-foreground block"
                    >
                      Paste your UTR / Transaction ID
                    </label>
                    <p className="text-xs text-muted-foreground">
                      After paying, find the UTR number in your Paytm
                      transaction history and paste it below.
                    </p>
                    <Input
                      id="utr-input"
                      value={utrInput}
                      onChange={(e) => setUtrInput(e.target.value)}
                      placeholder="e.g. 421234567890"
                      className="font-mono"
                      data-ocid="payment.utr_input"
                    />
                  </div>

                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={handleClose}
                      disabled={isSubmitting}
                      data-ocid="payment.cancel_button"
                    >
                      Cancel
                    </Button>
                    <Button
                      className="flex-1"
                      onClick={handleSubmitUtr}
                      disabled={isSubmitting || !utrInput.trim()}
                      data-ocid="payment.submit_button"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        <>
                          <Shield className="w-4 h-4 mr-2" /> Submit UTR
                        </>
                      )}
                    </Button>
                  </div>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}

function ManualPaymentSection({ vehicleNumber }: { vehicleNumber: string }) {
  const { data: violations, isLoading: violationsLoading } =
    useGetViolationTypes();
  const { data: upiId } = useGetUpiId();
  const { mutate: submitManual, isPending: isSubmitting } =
    useSubmitManualPayment();

  const [phone, setPhone] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [utrInput, setUtrInput] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const toggleViolation = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const selectedViolations = (violations ?? []).filter((v) =>
    selectedIds.has(v.id.toString()),
  );
  const rawTotal = selectedViolations.reduce((acc, v) => acc + v.amount, 0n);
  const discountedTotal = BigInt(Math.round(Number(rawTotal) * 0.7));

  const canProceed = phone.trim().length >= 10 && selectedIds.size > 0;

  const handleSubmit = () => {
    const trimmedUtr = utrInput.trim();
    if (!trimmedUtr || trimmedUtr.length < 6) {
      toast.error("Please enter a valid UTR number");
      return;
    }
    const violationNames = selectedViolations.map((v) => v.name).join(", ");
    submitManual(
      {
        vehicleNumber,
        phone: phone.trim(),
        violations: violationNames,
        totalAmount: discountedTotal,
        utr: trimmedUtr,
        submittedAt: new Date().toISOString(),
      },
      {
        onSuccess: () => {
          setSubmitted(true);
          toast.success("Manual payment submitted for review!");
        },
        onError: () => toast.error("Submission failed. Please try again."),
      },
    );
  };

  const handleClose = () => {
    setDialogOpen(false);
    setUtrInput("");
    setSubmitted(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="w-full mt-6"
      data-ocid="manual.section"
    >
      <div className="flex items-center gap-3 mb-4">
        <Separator className="flex-1" />
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider shrink-0">
          Know your violation? Pay manually
        </span>
        <Separator className="flex-1" />
      </div>

      <div className="bg-muted/40 border border-border rounded-xl p-5 space-y-4">
        {/* Phone */}
        <div className="space-y-1.5">
          <label
            htmlFor="manual-phone"
            className="text-sm font-semibold text-foreground flex items-center gap-1.5"
          >
            <Phone className="w-3.5 h-3.5 text-muted-foreground" />
            Your Phone Number
          </label>
          <Input
            id="manual-phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="e.g. 9876543210"
            className="max-w-xs"
            data-ocid="manual.phone.input"
          />
        </div>

        {/* Violations */}
        <div className="space-y-2">
          <p className="text-sm font-semibold text-foreground">
            Select Violation(s)
          </p>
          {violationsLoading ? (
            <div className="flex items-center gap-2 py-2">
              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                Loading violations...
              </span>
            </div>
          ) : !violations || violations.length === 0 ? (
            <p className="text-sm text-muted-foreground italic">
              Violations not configured yet. Please contact admin.
            </p>
          ) : (
            <div className="grid gap-2">
              {violations.map((v, i) => (
                <label
                  key={v.id.toString()}
                  htmlFor={`violation-${v.id}`}
                  className="flex items-center justify-between gap-3 bg-background border border-border rounded-lg px-4 py-2.5 cursor-pointer hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Checkbox
                      id={`violation-${v.id}`}
                      checked={selectedIds.has(v.id.toString())}
                      onCheckedChange={() => toggleViolation(v.id.toString())}
                      data-ocid={`manual.violation.checkbox.${i + 1}`}
                    />
                    <span className="text-sm font-medium text-foreground">
                      {v.name}
                    </span>
                  </div>
                  <span className="text-sm font-semibold text-muted-foreground shrink-0">
                    {formatCurrency(v.amount)}
                  </span>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Total */}
        {selectedIds.size > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="bg-background border border-border rounded-lg px-4 py-3 flex items-center justify-between"
            data-ocid="manual.total.panel"
          >
            <div>
              <p className="text-xs text-muted-foreground">
                {selectedIds.size} violation{selectedIds.size > 1 ? "s" : ""}{" "}
                selected
              </p>
              <p className="text-xs text-muted-foreground line-through">
                {formatCurrency(rawTotal)}
              </p>
              <p className="font-display font-bold text-lg text-primary">
                {formatCurrency(discountedTotal)}
              </p>
            </div>
            <Badge className="bg-green-600 hover:bg-green-600 text-white text-xs font-bold">
              30% OFF
            </Badge>
          </motion.div>
        )}

        <Button
          className="w-full gap-2"
          disabled={!canProceed}
          onClick={() => setDialogOpen(true)}
          data-ocid="manual.proceed.primary_button"
        >
          <IndianRupee className="w-4 h-4" />
          Proceed to Pay
        </Button>
      </div>

      {/* Manual Payment Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(v) => !v && handleClose()}>
        <DialogContent className="max-w-md" data-ocid="manual.payment.dialog">
          <AnimatePresence mode="wait">
            {submitted ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center py-8 gap-4"
                data-ocid="manual.success_state"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{
                    type: "spring",
                    stiffness: 260,
                    damping: 20,
                    delay: 0.1,
                  }}
                  className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center"
                >
                  <CheckCircle2 className="w-10 h-10 text-success" />
                </motion.div>
                <div className="text-center">
                  <h3 className="font-display font-bold text-2xl text-foreground mb-1">
                    Submitted!
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    Your payment will be reviewed shortly.
                  </p>
                </div>
                <Button
                  onClick={handleClose}
                  className="w-full"
                  data-ocid="manual.close_button"
                >
                  Done
                </Button>
              </motion.div>
            ) : (
              <motion.div
                key="payment"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col gap-5"
              >
                <DialogHeader>
                  <DialogTitle className="font-display text-xl">
                    Pay via Paytm UPI
                  </DialogTitle>
                </DialogHeader>

                {/* Summary */}
                <div className="bg-muted/60 rounded-xl p-4 space-y-2">
                  <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wide">
                    Violations
                  </p>
                  {selectedViolations.map((v) => (
                    <div
                      key={v.id.toString()}
                      className="flex justify-between text-sm"
                    >
                      <span className="text-foreground">{v.name}</span>
                      <span className="text-muted-foreground line-through">
                        {formatCurrency(v.amount)}
                      </span>
                    </div>
                  ))}
                  <Separator />
                  <div className="flex justify-between items-center">
                    <p className="font-display font-bold text-lg text-primary">
                      {formatCurrency(discountedTotal)}
                    </p>
                    <Badge className="bg-green-600 hover:bg-green-600 text-white text-xs font-bold">
                      30% OFF
                    </Badge>
                  </div>
                </div>

                {/* UPI */}
                {!upiId ? (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-center">
                    <AlertCircle className="w-6 h-6 text-amber-500 mx-auto mb-2" />
                    <p className="text-sm font-semibold text-amber-800">
                      Payment not configured.
                    </p>
                  </div>
                ) : (
                  <>
                    <UpiPayButton
                      upiId={upiId}
                      amount={discountedTotal}
                      note={`ChallanPay Manual - ${vehicleNumber}`}
                    />

                    <div className="space-y-2">
                      <label
                        htmlFor="manual-utr"
                        className="text-sm font-semibold text-foreground block"
                      >
                        Paste your UTR / Transaction ID
                      </label>
                      <Input
                        id="manual-utr"
                        value={utrInput}
                        onChange={(e) => setUtrInput(e.target.value)}
                        placeholder="e.g. 421234567890"
                        className="font-mono"
                        data-ocid="manual.utr.input"
                      />
                    </div>

                    <div className="flex gap-3">
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={handleClose}
                        disabled={isSubmitting}
                        data-ocid="manual.cancel_button"
                      >
                        Cancel
                      </Button>
                      <Button
                        className="flex-1"
                        onClick={handleSubmit}
                        disabled={isSubmitting || !utrInput.trim()}
                        data-ocid="manual.submit.primary_button"
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Submitting...
                          </>
                        ) : (
                          <>
                            <Shield className="w-4 h-4 mr-2" />
                            Submit UTR
                          </>
                        )}
                      </Button>
                    </div>
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}

function ChallanCard({
  challan,
  index,
  onPay,
}: { challan: Challan; index: number; onPay: (c: Challan) => void }) {
  const isPending = challan.status === Status.pending;
  const savings = challan.fineAmount - challan.discountedAmount;
  const discountPct = Math.round(
    (Number(savings) / Number(challan.fineAmount)) * 100,
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07, duration: 0.4 }}
      data-ocid={`challan.item.${index + 1}`}
    >
      <Card className="shadow-card hover:shadow-md transition-shadow duration-200 overflow-hidden">
        <CardContent className="p-0">
          <div
            className={`h-1 w-full ${isPending ? "bg-amber-400" : "bg-green-500"}`}
          />
          <div className="p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-xl shrink-0">
                  {getViolationIcon(challan.violationType)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-display font-semibold text-foreground">
                      {challan.violationType}
                    </h3>
                    <Badge
                      variant="outline"
                      className={`text-xs font-medium shrink-0 ${
                        isPending
                          ? "border-amber-400 text-amber-600 bg-amber-50"
                          : "border-green-500 text-green-600 bg-green-50"
                      }`}
                    >
                      {isPending ? (
                        <>
                          <Clock className="w-2.5 h-2.5 mr-1" /> Pending
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-2.5 h-2.5 mr-1" /> Paid
                        </>
                      )}
                    </Badge>
                  </div>
                  <div className="mt-1.5 space-y-0.5">
                    <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{challan.location}</span>
                    </p>
                    <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 shrink-0" />{" "}
                      {challan.date}
                    </p>
                    <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 shrink-0" />{" "}
                      {challan.officerName}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-end gap-2 shrink-0">
                <div className="text-right">
                  <p className="text-xs text-muted-foreground line-through">
                    {formatCurrency(challan.fineAmount)}
                  </p>
                  <p className="font-display font-bold text-xl text-foreground">
                    {formatCurrency(challan.discountedAmount)}
                  </p>
                </div>
                {isPending && (
                  <Badge className="bg-green-600 hover:bg-green-600 text-white text-xs font-bold">
                    {discountPct}% OFF
                  </Badge>
                )}
                {isPending ? (
                  <Button
                    size="sm"
                    onClick={() => onPay(challan)}
                    className="gap-1.5"
                    data-ocid={`challan.pay_button.${index + 1}`}
                  >
                    <IndianRupee className="w-3.5 h-3.5" /> Pay Now
                  </Button>
                ) : (
                  <div className="flex items-center gap-1.5 text-success text-sm font-medium">
                    <CheckCircle2 className="w-4 h-4" /> Cleared
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function SummaryBar({ challans }: { challans: Challan[] }) {
  const pending = challans.filter((c) => c.status === Status.pending);
  const totalDue = pending.reduce((acc, c) => acc + c.discountedAmount, 0n);
  const totalSavings = pending.reduce(
    (acc, c) => acc + (c.fineAmount - c.discountedAmount),
    0n,
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="grid grid-cols-3 gap-4 mb-6"
    >
      {[
        {
          icon: <AlertCircle className="w-5 h-5" />,
          label: "Challans Found",
          value: challans.length.toString(),
          color: "text-primary",
          bg: "bg-primary/10",
        },
        {
          icon: <IndianRupee className="w-5 h-5" />,
          label: "Total Dues",
          value: formatCurrency(totalDue),
          color: "text-amber-600",
          bg: "bg-amber-50",
        },
        {
          icon: <Tag className="w-5 h-5" />,
          label: "Total Savings",
          value: formatCurrency(totalSavings),
          color: "text-success",
          bg: "bg-green-50",
        },
      ].map((stat) => (
        <Card key={stat.label} className="shadow-card">
          <CardContent className="p-4 flex flex-col items-center text-center gap-2">
            <div
              className={`w-9 h-9 rounded-lg ${stat.bg} ${stat.color} flex items-center justify-center`}
            >
              {stat.icon}
            </div>
            <p
              className={`font-display font-bold text-lg leading-tight ${stat.color}`}
            >
              {stat.value}
            </p>
            <p className="text-xs text-muted-foreground">{stat.label}</p>
          </CardContent>
        </Card>
      ))}
    </motion.div>
  );
}

function MainApp() {
  const [searchInput, setSearchInput] = useState("");
  const [vehicleNumber, setVehicleNumber] = useState<string | null>(null);
  const [selectedChallan, setSelectedChallan] = useState<Challan | null>(null);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [apiChallans, setApiChallans] = useState<Challan[] | null>(null);
  const [isApiLoading, setIsApiLoading] = useState(false);
  const [usingLiveApi, setUsingLiveApi] = useState(false);

  const { data: supportNumber } = useGetSupportNumber();
  const { data: apiConfig } = useGetApiConfig();

  const {
    data: challans,
    isLoading,
    isError,
  } = useGetChallansByVehicle(vehicleNumber);
  const { mutate: _payChallan } = usePayChallan();

  // Attempt live API fetch when vehicle number and API config are both set
  useEffect(() => {
    if (!vehicleNumber || !apiConfig?.apiKey || !apiConfig?.apiBaseUrl) {
      setApiChallans(null);
      setUsingLiveApi(false);
      return;
    }

    let cancelled = false;
    setIsApiLoading(true);
    setApiChallans(null);
    setUsingLiveApi(false);

    const fetchFromApi = async () => {
      try {
        const res = await fetch(`${apiConfig.apiBaseUrl}/${vehicleNumber}`, {
          headers: {
            Authorization: `Bearer ${apiConfig.apiKey}`,
            "X-API-Key": apiConfig.apiKey ?? "",
            "Content-Type": "application/json",
          },
        });
        if (!res.ok) throw new Error(`API returned ${res.status}`);
        const data = await res.json();
        if (cancelled) return;
        if (Array.isArray(data)) {
          const mapped = data.map((item, idx) =>
            mapApiResponseToChallan(item as Record<string, unknown>, idx),
          );
          setApiChallans(mapped);
          setUsingLiveApi(true);
        } else if (
          data &&
          typeof data === "object" &&
          Array.isArray((data as Record<string, unknown>).challans)
        ) {
          const list = (data as Record<string, unknown>).challans as Record<
            string,
            unknown
          >[];
          const mapped = list.map((item, idx) =>
            mapApiResponseToChallan(item, idx),
          );
          setApiChallans(mapped);
          setUsingLiveApi(true);
        } else {
          // Unexpected format — fall back silently
          setApiChallans(null);
          setUsingLiveApi(false);
        }
      } catch {
        if (!cancelled) {
          setApiChallans(null);
          setUsingLiveApi(false);
        }
      } finally {
        if (!cancelled) setIsApiLoading(false);
      }
    };

    fetchFromApi();
    return () => {
      cancelled = true;
    };
  }, [vehicleNumber, apiConfig]);

  const displayedChallans = apiChallans ?? challans;
  const displayLoading = isLoading || isApiLoading;

  const handleSearch = () => {
    const trimmed = searchInput.trim().toUpperCase();
    if (!trimmed) {
      toast.error("Please enter a vehicle registration number");
      return;
    }
    setVehicleNumber(trimmed);
  };

  const handlePay = (challan: Challan) => {
    setSelectedChallan(challan);
    setPaymentOpen(true);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card shadow-xs sticky top-0 z-10">
        <div className="container max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img
              src="/assets/uploads/Government-of-India-Logo-Vector-PNG-1.png"
              alt="Government of India Logo"
              className="w-10 h-10 object-contain"
            />
            <div>
              <span className="font-display font-bold text-xl text-foreground tracking-tight">
                ChallanPay
              </span>
              <span className="font-display font-bold text-xl text-muted-foreground tracking-tight">
                {" | NPCI"}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {usingLiveApi && (
              <Badge className="text-xs bg-green-100 text-green-700 border-green-300 hover:bg-green-100 hidden sm:flex items-center gap-1">
                <Radio className="w-3 h-3" /> Live Data
              </Badge>
            )}
            <Badge
              variant="outline"
              className="text-xs text-muted-foreground hidden sm:flex"
            >
              <Zap className="w-3 h-3 mr-1 text-amber-500" /> Official Portal
            </Badge>
            <a
              href="https://mparivahan.in"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors border border-border rounded-md px-3 py-1.5 bg-card hover:bg-muted"
              data-ocid="header.mparivahan_link"
            >
              <ExternalLink className="w-3 h-3" />
              mParivahan
            </a>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section
        className="relative overflow-hidden"
        style={{
          backgroundImage: `linear-gradient(to bottom right, oklch(0.28 0.08 265), oklch(0.18 0.06 265)), url('/assets/generated/challan-hero-bg.dim_1600x600.jpg')`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundBlendMode: "overlay",
        }}
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_oklch(0.45_0.18_265_/_0.2)_0%,_transparent_60%)]" />
        <div className="container max-w-5xl mx-auto px-4 py-16 md:py-24 relative">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-2xl"
          >
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-1.5 mb-5">
              <Tag className="w-3.5 h-3.5 text-amber-300" />
              <span className="text-xs font-semibold text-amber-200 tracking-wide uppercase">
                Up to 30% Discount on All Challans
              </span>
            </div>
            <h1 className="font-display font-extrabold text-4xl md:text-5xl text-white leading-tight mb-4">
              Find & Pay Your
              <br />
              <span
                className="text-transparent bg-clip-text"
                style={{
                  backgroundImage: "linear-gradient(90deg, #93c5fd, #a5f3fc)",
                }}
              >
                Vehicle Challans
              </span>
            </h1>
            <p className="text-blue-200 text-lg mb-8 leading-relaxed">
              Search by vehicle registration number. Get instant access to
              pending challans and pay at a discount.
            </p>

            {/* Search box */}
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-2 flex gap-2 shadow-modal">
              <Input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                placeholder="Enter vehicle number e.g. MH12AB1234"
                className="flex-1 bg-transparent border-0 text-white placeholder:text-blue-300 focus-visible:ring-0 text-base font-medium h-12"
                data-ocid="search.input"
              />
              <Button
                onClick={handleSearch}
                disabled={displayLoading}
                className="h-12 px-6 rounded-xl font-semibold text-sm gap-2 shrink-0"
                data-ocid="search.primary_button"
              >
                {displayLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Search className="w-4 h-4" /> Search
                  </>
                )}
              </Button>
            </div>

            {/* Example vehicles */}
            <div className="flex items-center gap-2 mt-4 flex-wrap">
              <span className="text-xs text-blue-300">Try:</span>
              {EXAMPLE_VEHICLES.map((v) => (
                <button
                  type="button"
                  key={v}
                  onClick={() => {
                    setSearchInput(v);
                    setVehicleNumber(v);
                  }}
                  className="text-xs bg-white/10 hover:bg-white/20 border border-white/20 text-blue-200 px-3 py-1 rounded-full transition-colors cursor-pointer flex items-center gap-1"
                >
                  <Car className="w-3 h-3" /> {v}
                </button>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* How it works (shown when no search) */}
      <AnimatePresence>
        {!vehicleNumber && (
          <motion.section
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-card border-b border-border"
          >
            <div className="container max-w-5xl mx-auto px-4 py-12">
              <h2 className="font-display font-bold text-2xl text-foreground mb-8 text-center">
                How it works
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  {
                    step: "01",
                    icon: <Car className="w-6 h-6" />,
                    title: "Enter Vehicle Number",
                    desc: "Type your vehicle registration number in the search box above.",
                  },
                  {
                    step: "02",
                    icon: <AlertCircle className="w-6 h-6" />,
                    title: "View Pending Challans",
                    desc: "Instantly see all traffic violations linked to your vehicle.",
                  },
                  {
                    step: "03",
                    icon: <IndianRupee className="w-6 h-6" />,
                    title: "Pay at a Discount",
                    desc: "Clear your dues with up to 30% discount through our portal.",
                  },
                ].map((item, i) => (
                  <motion.div
                    key={item.step}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.12 }}
                    className="flex gap-4"
                  >
                    <div className="shrink-0">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                        {item.icon}
                      </div>
                    </div>
                    <div>
                      <span className="text-xs font-bold text-muted-foreground tracking-widest">
                        {item.step}
                      </span>
                      <h3 className="font-display font-semibold text-foreground mt-0.5">
                        {item.title}
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {item.desc}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* Results Section */}
      <main className="container max-w-5xl mx-auto px-4 py-8">
        {/* Loading */}
        {displayLoading && vehicleNumber && (
          <div
            className="flex flex-col items-center justify-center py-20 gap-4"
            data-ocid="challan.loading_state"
          >
            <Loader2 className="w-10 h-10 text-primary animate-spin" />
            <p className="text-muted-foreground font-medium">
              Searching challans for{" "}
              <span className="font-bold text-foreground">{vehicleNumber}</span>
              ...
            </p>
          </div>
        )}

        {/* Error */}
        {isError && (
          <div
            className="flex flex-col items-center py-16 gap-3"
            data-ocid="challan.error_state"
          >
            <AlertCircle className="w-10 h-10 text-destructive" />
            <p className="text-foreground font-semibold">
              Something went wrong
            </p>
            <p className="text-sm text-muted-foreground">
              Please try again or contact support.
            </p>
          </div>
        )}

        {/* Results */}
        {!displayLoading &&
          !isError &&
          displayedChallans !== undefined &&
          vehicleNumber && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mb-6 flex items-center justify-between"
              >
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="font-display font-bold text-2xl text-foreground">
                      Results for{" "}
                      <span className="text-primary">{vehicleNumber}</span>
                    </h2>
                    {usingLiveApi ? (
                      <Badge className="text-xs bg-green-100 text-green-700 border-green-300 hover:bg-green-100 flex items-center gap-1">
                        <Radio className="w-3 h-3" /> Live Data
                      </Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className="text-xs text-muted-foreground flex items-center gap-1"
                      >
                        Demo Data
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {displayedChallans.length} challan
                    {displayedChallans.length !== 1 ? "s" : ""} found
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setVehicleNumber(null);
                    setSearchInput("");
                    setApiChallans(null);
                    setUsingLiveApi(false);
                  }}
                  className="gap-1.5 text-sm"
                >
                  <Search className="w-3.5 h-3.5" /> New Search
                </Button>
              </motion.div>

              {displayedChallans.length > 0 && (
                <SummaryBar challans={displayedChallans} />
              )}

              {/* Empty state */}
              {displayedChallans.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center py-12 gap-4"
                  data-ocid="challan.empty_state"
                >
                  <div className="w-20 h-20 rounded-2xl bg-muted flex items-center justify-center">
                    <CheckCircle2 className="w-10 h-10 text-success" />
                  </div>
                  <div className="text-center">
                    <h3 className="font-display font-bold text-xl text-foreground">
                      No Challans Found
                    </h3>
                    <p className="text-muted-foreground mt-1 text-sm">
                      Great news! No pending challans for{" "}
                      <span className="font-semibold">{vehicleNumber}</span>.
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Check the official portal for more details.
                  </p>
                  {supportNumber && (
                    <div
                      className="flex flex-col items-center gap-2"
                      data-ocid="challan.support_helpline"
                    >
                      <p className="text-sm text-muted-foreground">
                        Need help? Call our helpline:
                      </p>
                      <a
                        href={`tel:${supportNumber}`}
                        className="flex items-center gap-2 bg-primary/10 text-primary font-semibold text-base px-5 py-2 rounded-full hover:bg-primary/20 transition-colors"
                      >
                        <Phone className="w-4 h-4" />
                        {supportNumber}
                      </a>
                    </div>
                  )}
                </motion.div>
              ) : (
                <div className="space-y-4" data-ocid="challan.list">
                  {displayedChallans.map((challan, i) => (
                    <ChallanCard
                      key={challan.id.toString()}
                      challan={challan}
                      index={i}
                      onPay={handlePay}
                    />
                  ))}
                </div>
              )}

              {/* Notice banner */}
              {displayedChallans.some((c) => c.status === Status.pending) && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="mt-6 bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3"
                >
                  <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-amber-800">
                      Discount valid for limited time
                    </p>
                    <p className="text-xs text-amber-700 mt-0.5">
                      Pay your challans now to avail up to 30% discount. Delayed
                      payment may result in additional penalties.
                    </p>
                  </div>
                </motion.div>
              )}

              {/* Manual Payment Section - always visible after results */}
              <ManualPaymentSection vehicleNumber={vehicleNumber} />
            </>
          )}

        {/* Initial state - no search yet */}
        {!vehicleNumber && (
          <div className="flex flex-col items-center py-12 gap-3 text-center">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Car className="w-8 h-8 text-primary" />
            </div>
            <p className="font-display font-semibold text-lg text-foreground">
              Enter your vehicle number above
            </p>
            <p className="text-sm text-muted-foreground max-w-sm">
              We'll fetch all challans associated with your vehicle and show
              available discounts.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-2 gap-1.5"
              onClick={() => {
                setSearchInput("MH12AB1234");
                setVehicleNumber("MH12AB1234");
              }}
            >
              <ChevronRight className="w-4 h-4" /> Try demo: MH12AB1234
            </Button>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-12">
        <div className="container max-w-5xl mx-auto px-4 py-6 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-primary" />
            <span className="font-display font-bold text-sm text-foreground">
              ChallanPay
            </span>
            <span className="text-xs text-muted-foreground">
              — Official Vehicle Challan Portal
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} ChallanPay. All rights reserved.
          </p>
        </div>
      </footer>

      {/* Payment Modal */}
      <PaymentModal
        challan={selectedChallan}
        open={paymentOpen}
        onClose={() => setPaymentOpen(false)}
      />

      <Toaster position="top-right" />
    </div>
  );
}

function RootRouter() {
  const [hash, setHash] = useState(() => window.location.hash);

  useEffect(() => {
    const handleHashChange = () => setHash(window.location.hash);
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  if (hash.startsWith("#/Srikant")) {
    return <AdminApp />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <MainApp />
    </QueryClientProvider>
  );
}

export default function App() {
  return <RootRouter />;
}
