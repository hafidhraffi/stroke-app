import { useMutation } from "@tanstack/react-query";
import { useForm, type SubmitHandler } from "react-hook-form";
import api from "../services/api";
import toast from "react-hot-toast";
import { useNavigate } from "react-router";

type RegisterInputs = {
    email: string;
    username: string;
    realname: string;
    password: string;
}

function RegisterPage() {
    const navigate = useNavigate()
    const {
        register,
        formState: { errors },
        handleSubmit
    } = useForm<RegisterInputs>()
    const onSubmit: SubmitHandler<RegisterInputs> = (data) => {
        toast.promise(
            mutation.mutateAsync(data),
            {
                loading: 'Mohon tunggu...',
                success: <b>Registrasi akun berhasil!</b>,
                error: <b>Registrasi akun gagal. Mohon coba lagi nanti.</b>,
            }
        );
    }

    const mutation = useMutation({
        mutationFn: async (formData: RegisterInputs) => {
            const { data } = await api.post(`/register`, formData);
            console.log(data)
            return data;
        },
        onSuccess: () => navigate("/login")
    })

    return (
        <>
            <div className="flex flex-col items-center">
                <form id="register-form" onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3 w-full max-w-100 items-center px-5">
                    <p className="w-full text-2xl font-semibold mt-20">Registrasi akun pengguna baru</p>
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
                        <input type="text" className="h-8 rounded border border-black focus:outline-none focus:border-2 px-1" {...register("realname", { required: "Nama lengkap wajib diisi" })} />
                        {errors.realname && <p className="text-red-500" role="alert">{errors.realname.message}</p>}
                    </div>
                    <div className="flex flex-col w-full">
                        <label>Password</label>
                        <input type="password" className="h-8 rounded border border-black focus:outline-none focus:border-2 px-1" {...register("password", { required: "Password wajib diisi", minLength: { value: 8, message: "Password harus terdapat minimal 8 karakter" } })} />
                        {errors.password && <p className="text-red-500" role="alert">{errors.password.message}</p>}
                    </div>
                    <button disabled={mutation.isPending} className="border w-full mt-2 rounded px-3 py-2 text-white border-green-400 bg-green-500 hover:bg-green-400 active:scale-95 cursor-pointer disabled:cursor-not-allowed disabled:bg-gray-400 disabled:border-gray-400">Registrasi</button>
                </form>
            </div>
        </>
    )
}

export default RegisterPage