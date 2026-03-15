import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  CheckCircle2,
  IndianRupee,
  Loader2,
  Lock,
  Settings,
  Shield,
  XCircle,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { UtrStatus } from "../backend.d";
import {
  useApproveUtr,
  useGetUpiId,
  useGetUtrSubmissions,
  useRejectUtr,
  useSetUpiId,
} from "../hooks/useQueries";

const ADMIN_PIN = "admin123";

function formatCurrency(amount: bigint): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(amount));
}

function StatusBadge({ status }: { status: UtrStatus }) {
  if (status === UtrStatus.approved) {
    return (
      <Badge className="bg-green-100 text-green-700 border-green-300 hover:bg-green-100">
        <CheckCircle2 className="w-3 h-3 mr-1" /> Approved
      </Badge>
    );
  }
  if (status === UtrStatus.rejected) {
    return (
      <Badge className="bg-red-100 text-red-700 border-red-300 hover:bg-red-100">
        <XCircle className="w-3 h-3 mr-1" /> Rejected
      </Badge>
    );
  }
  return (
    <Badge className="bg-amber-100 text-amber-700 border-amber-300 hover:bg-amber-100">
      <Loader2 className="w-3 h-3 mr-1" /> Pending
    </Badge>
  );
}

function AdminDashboard() {
  const [upiInput, setUpiInput] = useState("");
  const { data: currentUpiId, isLoading: upiLoading } = useGetUpiId();
  const { mutate: setUpiId, isPending: isSavingUpi } = useSetUpiId();
  const { data: utrSubmissions, isLoading: utrLoading } =
    useGetUtrSubmissions();
  const { mutate: approveUtr, isPending: isApproving } = useApproveUtr();
  const { mutate: rejectUtr, isPending: isRejecting } = useRejectUtr();

  const handleSaveUpi = () => {
    const trimmed = upiInput.trim();
    if (!trimmed) {
      toast.error("Please enter a valid UPI ID");
      return;
    }
    setUpiId(trimmed, {
      onSuccess: () => {
        toast.success("UPI ID saved successfully!");
        setUpiInput("");
      },
      onError: () => {
        toast.error("Failed to save UPI ID");
      },
    });
  };

  const handleApprove = (utrId: bigint, index: number) => {
    approveUtr(utrId, {
      onSuccess: () => toast.success(`UTR #${index + 1} approved`),
      onError: () => toast.error("Failed to approve UTR"),
    });
  };

  const handleReject = (utrId: bigint, index: number) => {
    rejectUtr(utrId, {
      onSuccess: () => toast.success(`UTR #${index + 1} rejected`),
      onError: () => toast.error("Failed to reject UTR"),
    });
  };

  return (
    <div className="space-y-6 pb-6">
      {/* UPI Management */}
      <Card className="border border-border shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
              <IndianRupee className="w-4 h-4 text-primary" />
            </div>
            Paytm UPI ID
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted/60 rounded-lg p-3">
            <p className="text-xs text-muted-foreground mb-1">Current UPI ID</p>
            {upiLoading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  Loading...
                </span>
              </div>
            ) : currentUpiId ? (
              <p className="font-mono font-semibold text-foreground text-sm">
                {currentUpiId}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground italic">
                No UPI ID configured
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <div className="flex-1">
              <Label
                htmlFor="upi-input"
                className="text-xs text-muted-foreground mb-1.5 block"
              >
                New UPI ID (e.g. business@paytm)
              </Label>
              <Input
                id="upi-input"
                value={upiInput}
                onChange={(e) => setUpiInput(e.target.value)}
                placeholder="yourname@paytm"
                className="font-mono"
                data-ocid="admin.upi_input"
              />
            </div>
            <div className="flex items-end">
              <Button
                onClick={handleSaveUpi}
                disabled={isSavingUpi || !upiInput.trim()}
                size="sm"
                className="h-10"
                data-ocid="admin.upi_save_button"
              >
                {isSavingUpi ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Save"
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* UTR Submissions */}
      <Card className="border border-border shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <div className="w-7 h-7 rounded-lg bg-amber-100 flex items-center justify-center">
              <Shield className="w-4 h-4 text-amber-600" />
            </div>
            UTR Submissions
            {utrSubmissions && utrSubmissions.length > 0 && (
              <Badge variant="secondary" className="ml-auto text-xs">
                {
                  utrSubmissions.filter((u) => u.status === UtrStatus.pending)
                    .length
                }{" "}
                pending
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {utrLoading ? (
            <div className="flex items-center justify-center py-8 gap-2">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                Loading submissions...
              </span>
            </div>
          ) : !utrSubmissions || utrSubmissions.length === 0 ? (
            <div
              className="flex flex-col items-center py-10 gap-2"
              data-ocid="admin.utr.empty_state"
            >
              <CheckCircle2 className="w-8 h-8 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">
                No UTR submissions yet
              </p>
            </div>
          ) : (
            <ScrollArea className="w-full">
              <div className="min-w-[600px]">
                <Table data-ocid="admin.utr.table">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Challan ID</TableHead>
                      <TableHead className="text-xs">Vehicle</TableHead>
                      <TableHead className="text-xs">Amount</TableHead>
                      <TableHead className="text-xs">UTR Number</TableHead>
                      <TableHead className="text-xs">Submitted At</TableHead>
                      <TableHead className="text-xs">Status</TableHead>
                      <TableHead className="text-xs">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {utrSubmissions.map((record, i) => (
                      <TableRow
                        key={record.id.toString()}
                        data-ocid={`admin.utr.item.${i + 1}`}
                      >
                        <TableCell className="font-mono text-xs">
                          #{record.challanId.toString()}
                        </TableCell>
                        <TableCell className="text-xs font-semibold">
                          {record.vehicleNumber}
                        </TableCell>
                        <TableCell className="text-xs font-semibold text-primary">
                          {formatCurrency(record.amount)}
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {record.utr}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {new Date(record.submittedAt).toLocaleString(
                            "en-IN",
                            {
                              day: "2-digit",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit",
                            },
                          )}
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={record.status} />
                        </TableCell>
                        <TableCell>
                          {record.status === UtrStatus.pending ? (
                            <div className="flex gap-1.5">
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 px-2 text-xs text-green-700 border-green-300 hover:bg-green-50"
                                onClick={() => handleApprove(record.id, i)}
                                disabled={isApproving || isRejecting}
                                data-ocid={`admin.utr.approve_button.${i + 1}`}
                              >
                                {isApproving ? (
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                ) : (
                                  <CheckCircle2 className="w-3 h-3" />
                                )}
                                <span className="ml-1">Approve</span>
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 px-2 text-xs text-red-700 border-red-300 hover:bg-red-50"
                                onClick={() => handleReject(record.id, i)}
                                disabled={isApproving || isRejecting}
                                data-ocid={`admin.utr.reject_button.${i + 1}`}
                              >
                                {isRejecting ? (
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                ) : (
                                  <XCircle className="w-3 h-3" />
                                )}
                                <span className="ml-1">Reject</span>
                              </Button>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">
                              —
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function AdminLogin({ onLogin }: { onLogin: () => void }) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);

  const handleLogin = () => {
    if (pin === ADMIN_PIN) {
      onLogin();
      setError(false);
    } else {
      setError(true);
      setPin("");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center py-12 gap-6">
      <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
        <Lock className="w-8 h-8 text-primary" />
      </div>
      <div className="text-center">
        <h3 className="font-display font-bold text-xl text-foreground">
          Admin Access
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          Enter your PIN to continue
        </p>
      </div>
      <div className="w-full max-w-xs space-y-3">
        <Input
          type="password"
          value={pin}
          onChange={(e) => {
            setPin(e.target.value);
            setError(false);
          }}
          onKeyDown={(e) => e.key === "Enter" && handleLogin()}
          placeholder="Enter admin PIN"
          className={
            error ? "border-destructive focus-visible:ring-destructive" : ""
          }
          data-ocid="admin.pin_input"
        />
        {error && (
          <p
            className="text-xs text-destructive"
            data-ocid="admin.pin.error_state"
          >
            Incorrect PIN. Please try again.
          </p>
        )}
        <Button
          className="w-full"
          onClick={handleLogin}
          disabled={!pin}
          data-ocid="admin.login_button"
        >
          <Lock className="w-4 h-4 mr-2" /> Login
        </Button>
      </div>
    </div>
  );
}

export function AdminPanel({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const handleClose = () => {
    setIsLoggedIn(false);
    onClose();
  };

  return (
    <Sheet open={open} onOpenChange={(v) => !v && handleClose()}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-2xl overflow-hidden flex flex-col p-0"
      >
        <SheetHeader className="px-6 py-4 border-b border-border shrink-0">
          <SheetTitle className="flex items-center gap-2 font-display">
            <Settings className="w-5 h-5 text-primary" />
            Admin Panel
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            {!isLoggedIn ? (
              <motion.div
                key="login"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="px-6"
              >
                <AdminLogin onLogin={() => setIsLoggedIn(true)} />
              </motion.div>
            ) : (
              <motion.div
                key="dashboard"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="px-6 pt-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm text-muted-foreground">
                    Logged in as{" "}
                    <span className="font-semibold text-foreground">Admin</span>
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs text-muted-foreground h-7"
                    onClick={() => setIsLoggedIn(false)}
                  >
                    Logout
                  </Button>
                </div>
                <Separator className="mb-6" />
                <AdminDashboard />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </SheetContent>
    </Sheet>
  );
}
