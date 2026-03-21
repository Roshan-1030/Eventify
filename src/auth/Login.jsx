const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // 🔐 ADMIN LOGIN
    if (role === 'admin') {
        try {
            const userCred = await signInWithEmailAndPassword(auth, email, password);
            const user = userCred.user;

            const profileDoc = await getDoc(doc(db, "profiles", user.uid));

            if (!profileDoc.exists()) {
                setError("Admin profile not found. Please register first.");
                return;
            }

            const profile = profileDoc.data();

            login({
                id: user.uid,
                name: profile.name,
                role: profile.role,
                email: profile.email,
                roomId: profile.room_id
            });

            navigate('/');

        } catch (err) {
            if (err.code === "auth/invalid-credential") {
                setError("Invalid email or password");
            } else {
                setError(err.message.replace("Firebase: ", ""));
            }
        } finally {
            setLoading(false);
        }
    }

    // 🎓 STUDENT LOGIN
    else {
        if (!roomId || !studentName || !studentEmail || !studentBranch || !studentYear) {
            setError("All fields are required.");
            setLoading(false);
            return;
        }

        try {
            // 🔍 Check admin room exists
            const adminQuery = query(
                collection(db, "profiles"),
                where("room_id", "==", roomId),
                where("role", "==", "admin")
            );

            const adminSnap = await getDocs(adminQuery);

            if (adminSnap.empty) {
                setError("Invalid Room ID.");
                return;
            }

            // 🔎 Check existing student
            const studentQuery = query(
                collection(db, "profiles"),
                where("email", "==", studentEmail),
                where("room_id", "==", roomId),
                where("role", "==", "student") // ✅ FIX
            );

            const studentSnap = await getDocs(studentQuery);

            let studentData;

            if (!studentSnap.empty) {
                const studentDoc = studentSnap.docs[0];

                await updateDoc(doc(db, "profiles", studentDoc.id), {
                    name: studentName,
                    branch: studentBranch,
                    year: studentYear
                });

                studentData = {
                    id: studentDoc.id,
                    ...studentDoc.data(),
                    name: studentName,
                    branch: studentBranch,
                    year: studentYear
                };

            } else {
                const studentId = `STU-${Date.now()}`;

                studentData = {
                    id: studentId,
                    name: studentName,
                    email: studentEmail,
                    role: "student",
                    room_id: roomId,
                    branch: studentBranch,
                    year: studentYear,
                    createdAt: new Date()
                };

                await setDoc(doc(db, "profiles", studentId), studentData);
            }

            login({
                id: studentData.id,
                name: studentData.name,
                email: studentData.email,
                branch: studentData.branch,
                year: studentData.year,
                role: 'student',
                roomId: studentData.room_id
            });

            navigate('/');

        } catch (err) {
            setError("Something went wrong. Try again.");
            console.error(err);
        } finally {
            setLoading(false);
        }
    }
};