import { useMutation } from "@tanstack/react-query";
import { useForm, type SubmitHandler } from "react-hook-form";
import api from "../../services/api";
import toast from "react-hot-toast";

type CreateAccountInputs = {
    email: string;
    username: string;
    realname: string;
    password: string;
    role: string;
}
function CreateAccountPage() {
    const {
        register,
        formState: { errors },
        handleSubmit,
        reset
    } = useForm<CreateAccountInputs>()
    const onSubmit: SubmitHandler<CreateAccountInputs> = (data) => {
        toast.promise(
            createAccountMutation.mutateAsync(data),
            {
                loading: 'Mohon tunggu...',
                success: (response) => <b>{response.message}</b>,
                error: <b>Pembuatan akun gagal. Mohon coba lagi nanti.</b>,
            }
        );
    }

    const createAccountMutation = useMutation({
        mutationFn: async (formData: CreateAccountInputs) => {
            const { role, ...payload } = formData
            const { data } = await api.post(`/admin/${role == "admin" ? 'create-admin' : 'create-doctor'}`, payload, {
                headers: {
                    "Authorization": `Bearer ${localStorage.getItem("token")}`
                }
            })
            return data
        },
        onSuccess: () => {
            reset()
        }
    })

    return (
        <>
            <div className="flex flex-col items-center">
                <form id="register-form" onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3 w-full max-w-100 px-5">
                    <p className="w-full text-2xl font-semibold mt-5">Buat akun (untuk Admin)</p>
                    <div className="flex flex-col w-full">
                        <label>Email</label>
                        <input type="email" className="h-8 rounded border border-black focus:outline-none focus:border-2 px-1" {...register("email", { required: "Email wajib diisi" })} />
                        {errors.email && <p className="text-red-500" role="alert">{errors.email.message}</p>}
                    </div>
                    <div className="flex flex-col w-full">
                        <label>Username</label>
                        <input type="text" className="h-8 rounded border border-black focus:outline-none focus:border-2 px-1" {...register("username", { required: "Username wajib diisi" })} />
                        {errors.username && <p className="text-red-500" role="alert">{errors.username.message}</p>}
                    </div>
                    <div className="flex flex-col w-full">
                        <label>Nama lengkap</label>
                        <input type="text" className="h-8 rounded border border-black focus:outline-none focus:border-2 px-1" {...register("realname", { required: "Full name wajib diisi" })} />
                        {errors.realname && <p className="text-red-500" role="alert">{errors.realname.message}</p>}
                    </div>
                    <div className="flex flex-col w-full">
                        <label>Password</label>
                        <input type="password" className="h-8 rounded border border-black focus:outline-none focus:border-2 px-1" {...register("password", { required: "Password wajib diisi", minLength: { value: 8, message: "Password harus terdapat minimal 8 karakter" } })} />
                        {errors.password && <p className="text-red-500" role="alert">{errors.password.message}</p>}
                    </div>
                    <div className="w-fit flex flex-col">
                        <label>Role</label>
                        <div className="flex gap-2 text-sm items-center">
                            <input type="radio" {...register("role", { required: "Role wajib diisi" })} value="admin" />
                            <label>Admin</label>
                        </div>
                        <div className="flex gap-2 text-sm items-center">
                            <input type="radio" {...register("role", { required: "Role wajib diisi" })} value="doctor" />
                            <label>Dokter</label>
                        </div>
                        {errors.role && <p className="text-red-500" role="alert">{errors.role.message}</p>}
                    </div>
                    <button className="border w-full mt-2 rounded px-3 py-2 text-white border-green-400 bg-green-500 hover:bg-green-400 active:scale-95 cursor-pointer">Registrasi</button>
                </form>
            </div>
        </>
    )
}

export default CreateAccountPage