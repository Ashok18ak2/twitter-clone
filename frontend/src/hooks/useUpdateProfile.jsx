import { useMutation,useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { baseUrl } from "../constant/url";

	

 const useUpdateProfile = () => {
	const queryClient = useQueryClient();
      const {mutateAsync:updateProfile ,isPending:isUpdatingProfile} = useMutation({
        mutationFn: async(formData)=>{
            try {
                const res = await fetch(`${baseUrl}/api/users/update`,{
                    method:"POST",
                    credentials:"include",
                    headers:{
                        "Content-Type":"application/json"
                    },
                    body:JSON.stringify(formData)
                })
                const data = await res.json();
                if(!res.ok){
                    throw new Error(data.error || "something went wrong ")
                }
                return data
            } catch (error) {
                throw error
            }
        },
        onSuccess:()=>{
            Promise.all([
                queryClient.invalidateQueries({queryKey:["authUser"]}),
                queryClient.invalidateQueries({queryKey:["userProfile"]}),
            ])
            toast.success("profile updated")
        },
        onError:(error)=>{
            toast.success(error.message)
        }
    })
    return{updateProfile,isUpdatingProfile}
}

export default useUpdateProfile
