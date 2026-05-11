import { useQuery } from "@tanstack/react-query"
import { Column } from "primereact/column"
import { DataTable } from "primereact/datatable"
import api from "../../services/api"
import { useState } from "react"
import LogDetail from "../../components/LogDetail"
import { XCircleIcon } from "@heroicons/react/24/outline"
import { Skeleton } from "primereact/skeleton"

function LogPage() {
    const [detailVisible, setDetailVisible] = useState(false)
    const [selectedLogData, setSelectedLogData] = useState()

    const fetchLogs = async () => {
        const { data } = await api.get("/logs", {
            headers: {
                "Authorization": `Bearer ${localStorage.getItem("token")}`
            }
        })
        return data
    }

    const { data, isPending, isSuccess, isError } = useQuery({
        queryKey: ['logs'],
        queryFn: fetchLogs,
    })

    const diagnoseColumn = (rowData: any) => {
        return (
            <>
                {
                    rowData.diagnose == "Bleeding" && <p>Hemorrhagic</p>
                }
                {
                    rowData.diagnose == "Ischemia" && <p>Ischemic</p>
                }
                {
                    rowData.diagnose == "Normal" && <p>Normal</p>
                }
            </>
        )
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const actionColumn = (rowData: any) => {
        return (
            <button
                onClick={() => {
                    setSelectedLogData(rowData)
                    setDetailVisible(true)
                }}
                className="border w-32 rounded h-10 hover:bg-gray-200 active:scale-95 cursor-pointer"
            >
                Detail
            </button>
        )
    }

    return (
        <div className="max-md:text-sm max-sm:text-xs">
            <p className="text-3xl ml-10">Log</p>
            <LogDetail
                detailVisible={detailVisible}
                setDetailVisible={setDetailVisible}
                selectedLogData={selectedLogData}
            />
            <div className="my-10 px-10">
                {
                    isPending &&
                    <Skeleton height="400px" />
                }
                {
                    isSuccess &&
                    <DataTable
                        className="w-full"
                        sortField="timestamp"
                        sortOrder={-1}
                        value={data}
                        stripedRows
                        tableStyle={{ minWidth: '50rem' }}
                        paginator
                        rows={5}
                        rowsPerPageOptions={[5, 10, 25, 50]}
                    >
                        <Column header="No." body={(_, options) => options.rowIndex + 1} />
                        <Column field="patient_name" header="Pasien" />
                        <Column field="doctor_name" header="Dokter" />
                        <Column header="Diagnosis" body={diagnoseColumn} />
                        <Column field="timestamp" header="Tanggal" />
                        <Column header="Aksi" body={actionColumn} />
                    </DataTable>
                }
                {
                    isError &&
                    <div className="flex items-center justify-center h-100">
                        <div className='text-sm max-md:text-xs flex gap-3 items-center h-fit bg-red-100 w-fit py-1 px-3 rounded border border-red-600 text-red-600'>
                            <XCircleIcon className='h-5 shrink-0' />
                            <p>Tidak dapat terhubung ke server. Mohon coba lagi nanti.</p>
                        </div>
                    </div>
                }
            </div>
        </div>
    )
}

export default LogPage