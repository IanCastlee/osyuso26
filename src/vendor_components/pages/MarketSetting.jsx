import React, { useState, useRef, useEffect } from "react";
import { icons } from "../../constant/icons";
import bgImg from "../../assets/assets_osyuso/bg.webp";
import profileImage from "../../assets/assets_osyuso/shop.png";
import { LazyLoadImage } from "react-lazy-load-image-component";
import InputField from "../atoms/InputField";
import useFormSubmit from "../../hooks/useFormSubmit";
import useGetData from "../../hooks/useGetData";
import Loader from "../../reusable_components/Loader";
import LoaderWithText from "../../reusable_components/LoaderWithText";
import { useToast } from "../../context/ToastContext";

function MarketSetting() {
  const profileInputRef = useRef();
  const coverInputRef = useRef();

  // ================= FETCH EXISTING DATA =================
  const { data, loading: fetching } = useGetData(
    "market/get-market-settings.php",
  );

  const { showToast } = useToast();

  const [profilePreview, setProfilePreview] = useState(null);
  const [coverPreview, setCoverPreview] = useState(null);

  const [profileFile, setProfileFile] = useState(null);
  const [coverFile, setCoverFile] = useState(null);

  const [form, setForm] = useState({
    fullname: "",
    address: "",
    nearby: "",
    shop_name: "",
    shop_description: "",
    phone: "",
  });

  // ================= PREFILL DATA =================
  useEffect(() => {
    if (!data) return;

    setForm({
      fullname: data.fullname || "",
      address: data.address || "",
      nearby: data.nearby || "",
      shop_name: data.shop_name || "",
      shop_description: data.shop_description || "",
      phone: data.phone || "",
    });

    setProfilePreview(data.profile_picture || null);
    setCoverPreview(data.cover_photo || null);
  }, [data]);

  // ================= INPUT HANDLER =================
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const { submit, loading } = useFormSubmit(
    "market/update-market-settings.php",
    () => {
      showToast({
        type: "success",
        message: "Market settings updated successfully!",
        duration: 5000,
      });
    },
  );
  // ================= SUBMIT =================
  const handleSubmit = async () => {
    const formData = new FormData();

    Object.keys(form).forEach((key) => {
      formData.append(key, form[key]);
    });

    if (profileFile) formData.append("profile_picture", profileFile);
    if (coverFile) formData.append("cover_photo", coverFile);

    await submit(formData);
  };
  // const handleSubmit = async () => {
  //   const formData = new FormData();

  //   Object.keys(form).forEach((key) => {
  //     formData.append(key, form[key]);
  //   });

  //   if (profileFile) {
  //     console.log("ADDING PROFILE:", profileFile);
  //     formData.append("profile_picture", profileFile);
  //   }

  //   if (coverFile) {
  //     console.log("ADDING COVER:", coverFile);
  //     formData.append("cover_photo", coverFile);
  //   }

  //   // 🔥 DEBUG THIS
  //   for (let pair of formData.entries()) {
  //     console.log("FD:", pair[0], pair[1]);
  //   }

  //   await submit(formData);
  // };

  // ================= PROFILE =================
  const handleProfileClick = () => {
    profileInputRef.current.click();
  };

  const handleProfileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfileFile(file);
      setProfilePreview(URL.createObjectURL(file));
    }
  };

  // ================= COVER =================
  const handleCoverClick = () => {
    coverInputRef.current.click();
  };

  const handleCoverChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setCoverFile(file);
      setCoverPreview(URL.createObjectURL(file));
    }
  };

  // ================= LOADING =================
  if (fetching) {
    return (
      <div className="p-6 text-sm text-gray-500">
        <Loader />
      </div>
    );
  }

  return (
    <div className="w-full min-h-full p-4 flex flex-col gap-4 bg-gray-100">
      {/* HEADER */}
      <div className="bg-white rounded-xl shadow px-4 py-4 flex justify-between">
        <h1 className="flex items-center text-lg font-bold">
          <icons.CiSettings className="mr-2 text-secondary text-2xl" />
          Market Settings
        </h1>

        <button
          onClick={handleSubmit}
          className="bg-green-500 text-white px-4 py-2 rounded text-xs"
        >
          {loading ? (
            <LoaderWithText text="Updating..." size="w-3 h-3" />
          ) : (
            "Save Changes"
          )}
        </button>
      </div>

      {/* COVER */}
      <div
        onClick={handleCoverClick}
        className="w-full h-[180px] relative rounded-2xl overflow-hidden cursor-pointer"
      >
        <LazyLoadImage
          src={coverPreview || bgImg}
          className="w-full h-full object-cover"
        />

        <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
          <span className="text-white text-xs">
            Click to change cover photo
          </span>
        </div>

        {/* PROFILE */}
        <div
          onClick={(e) => {
            e.stopPropagation();
            handleProfileClick();
          }}
          className="w-[90px] h-[90px] sm:w-[110px] sm:h-[110px] md:w-[120px] md:h-[120px]
          rounded-full absolute left-4 -bottom-0 overflow-hidden border-4 border-white cursor-pointer z-10"
        >
          <LazyLoadImage
            src={profilePreview || profileImage}
            className="w-full h-full object-cover"
          />
        </div>
      </div>

      {/* HIDDEN INPUTS */}
      <input
        type="file"
        ref={profileInputRef}
        onChange={handleProfileChange}
        hidden
      />

      <input
        type="file"
        ref={coverInputRef}
        onChange={handleCoverChange}
        hidden
      />

      {/* FORM */}
      <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-3">
        <InputField
          label="Full Name"
          name="fullname"
          value={form.fullname}
          onChange={handleChange}
        />

        <InputField
          label="Shop Name"
          name="shop_name"
          value={form.shop_name}
          onChange={handleChange}
        />

        <InputField
          label="Phone"
          name="phone"
          value={form.phone}
          onChange={handleChange}
        />

        <InputField
          label="Address"
          name="address"
          value={form.address}
          onChange={handleChange}
        />

        <InputField
          label="Nearby Landmark"
          name="nearby"
          value={form.nearby}
          onChange={handleChange}
        />

        <InputField
          label="Shop Description"
          name="shop_description"
          value={form.shop_description}
          onChange={handleChange}
        />
      </div>
    </div>
  );
}

export default MarketSetting;
