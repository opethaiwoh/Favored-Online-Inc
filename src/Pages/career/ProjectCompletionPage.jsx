// src/Pages/career/ProjectCompletionPage.jsx - COMPLETE RESPONSIVE VERSION

// Fixed badge assignment process with proper error handling AND mobile menu state AND full responsiveness
// 🔥 UPDATED: Now includes badge award email notifications

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  doc, 
  getDoc, 
  updateDoc, 
  addDoc, 
  collection,
  query,
  where,
  getDocs,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../../firebase/config';
import { toast } from 'react-toastify';

// 🔥 EMAIL NOTIFICATION HELPER FUNCTION - Same as ProjectOwnerDashboard
const sendEmailNotification = async (endpoint, data) => {
  try {
    console.log(`📧 Sending email notification via ${endpoint}...`);
    
    const response = await fetch(`/api/notifications/${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();
    
    if (result.success) {
      console.log(`✅ Email notification sent successfully:`, result.results);
      return { success: true, results: result.results };
    } else {
      console.error(`❌ Email notification failed:`, result.error);
      return { success: false, error: result.error };
    }
    
  } catch (error) {
    console.error(`💥 Error sending email notification:`, error);
    return { success: false, error: error.message };
  }
};

const ProjectCompletionPage = () => {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [group, setGroup] = useState(null);
  const [members, setMembers] = useState([]);
  const [completionData, setCompletionData] = useState(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [evaluationForm, setEvaluationForm] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [adminCertificate, setAdminCertificate] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Badge categories mapping
  const badgeCategories = {
    'mentorship': { id: 'techmo', name: 'TechMO Badges', color: 'from-yellow-500 to-yellow-600', image: '/Images/TechMO.png' },
    'quality-assurance': { id: 'techqa', name: 'TechQA Badges', color: 'from-blue-500 to-blue-600', image: '/Images/TechQA.png' },
    'development': { id: 'techdev', name: 'TechDev Badges', color: 'from-green-500 to-green-600', image: '/Images/TechDev.png' },
    'leadership': { id: 'techleads', name: 'TechLeads Badges', color: 'from-purple-500 to-purple-600', image: '/Images/TechLeads.png' },
    'design': { id: 'techarchs', name: 'TechArchs Badges', color: 'from-orange-500 to-orange-600', image: '/Images/TechArchs.png' },
    'security': { id: 'techguard', name: 'TechGuard Badges', color: 'from-red-500 to-red-600', image: '/Images/TechGuard.png' }
  };

  const badgeLevels = ['novice', 'beginners', 'intermediate', 'expert'];
  const contributionLevels = ['poor', 'fair', 'good', 'excellent'];

  useEffect(() => {
    fetchGroupData();
  }, [groupId]);

  const fetchGroupData = async () => {
    try {
      console.log('🔍 Fetching group data for:', groupId);
      
      // Fetch group data
      const groupDoc = await getDoc(doc(db, 'groups', groupId));
      if (!groupDoc.exists()) {
        toast.error('Group not found');
        navigate('/my-groups');
        return;
      }

      const groupData = { id: groupDoc.id, ...groupDoc.data() };
      setGroup(groupData);

      console.log('📋 Group data:', groupData);

      // Check if user is admin
      const memberQuery = query(
        collection(db, 'group_members'),
        where('groupId', '==', groupId),
        where('userEmail', '==', currentUser.email)
      );
      const memberDocs = await getDocs(memberQuery);
      
      if (memberDocs.empty) {
        toast.error('You are not a member of this group');
        navigate(`/groups/${groupId}`);
        return;
      }

      const memberData = memberDocs.docs[0].data();
      if (memberData.role !== 'admin' && groupData.adminEmail !== currentUser.email) {
        toast.error('Only project admins can access completion page');
        navigate(`/groups/${groupId}`);
        return;
      }

      // Fetch all group members
      const allMembersQuery = query(
        collection(db, 'group_members'),
        where('groupId', '==', groupId),
        where('status', '==', 'active')
      );
      const allMemberDocs = await getDocs(allMembersQuery);
      const membersList = allMemberDocs.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMembers(membersList);

      // Check for existing completion data
      const completionQuery = query(
        collection(db, 'project_completion_requests'),
        where('groupId', '==', groupId)
      );
      const completionDocs = await getDocs(completionQuery);
      
      if (!completionDocs.empty) {
        const completion = { id: completionDocs.docs[0].id, ...completionDocs.docs[0].data() };
        setCompletionData(completion);
        
        console.log('📋 Existing completion data:', completion);
        
        // Determine current step based on completion status
        if (completion.finalCompletion?.completed === true) {
          setCurrentStep(3); // Fully completed
          
          // Fetch admin certificate if exists
          const certificateQuery = query(
            collection(db, 'certificates'),
            where('recipientEmail', '==', currentUser.email),
            where('groupId', '==', groupId),
            where('type', '==', 'project_owner')
          );
          const certificateDocs = await getDocs(certificateQuery);
          if (!certificateDocs.empty) {
            setAdminCertificate({ id: certificateDocs.docs[0].id, ...certificateDocs.docs[0].data() });
          }
          setEvaluationForm(completion.evaluationForm?.memberEvaluations || []);
        } else if (completion.adminApproval?.approved === true) {
          setCurrentStep(2); // Admin approved, can assign badges
          // Always initialize with fresh member data to ensure current team state
          initializeEvaluationForm(membersList);
        } else {
          setCurrentStep(1); // Waiting for admin approval
        }
      } else {
        // Check if this is a completed project submission (admin already approved the project)
        // Look for admin approval in group status or other indicators
        if (groupData.completionStatus?.isReadyForCompletion || groupData.status === 'approved') {
          setCurrentStep(2); // Can assign badges
          initializeEvaluationForm(membersList);
        } else {
          setCurrentStep(1); // No completion request yet - waiting for admin approval
        }
      }

      setLoading(false);
    } catch (error) {
      console.error('❌ Error fetching group data:', error);
      toast.error('Error loading completion data: ' + error.message);
      setLoading(false);
    }
  };

  const initializeEvaluationForm = (membersList) => {
    console.log('🔧 Initializing evaluation form...');
    console.log('📋 All members received:', membersList);
    console.log('👤 Current user email:', currentUser.email);
    
    // More comprehensive debugging of member structure
    membersList.forEach((member, index) => {
      console.log(`📝 Member ${index}:`, {
        fullObject: member,
        userEmail: member.userEmail,
        email: member.email,
        memberEmail: member.memberEmail,
        userName: member.userName,
        displayName: member.displayName,
        role: member.role,
        projectRole: member.projectRole
      });
    });
    
    // Filter out the current user (project admin) from team members to evaluate
    const teamMembersToEvaluate = membersList.filter(member => {
      // Try multiple possible email fields
      const memberEmail = member.userEmail || member.email || member.memberEmail;
      const currentUserEmail = currentUser.email;
      
      const isNotCurrentUser = memberEmail && memberEmail.toLowerCase() !== currentUserEmail.toLowerCase();
      
      console.log(`👥 Evaluating Member:`, {
        memberName: member.userName || member.displayName || memberEmail,
        memberEmail: memberEmail,
        currentUserEmail: currentUserEmail,
        isNotCurrentUser: isNotCurrentUser
      });
      
      return isNotCurrentUser;
    });
    
    console.log('✅ Team members to evaluate after filtering:', teamMembersToEvaluate);
    
    if (teamMembersToEvaluate.length === 0) {
      console.log('⚠️ No team members found after filtering. Possible reasons:');
      console.log('- All members have the same email as current user');
      console.log('- Member objects are missing email fields');
      console.log('- Email field names are different than expected');
      console.log('- All members are admins/owners');
    }
    
    const form = teamMembersToEvaluate.map(member => ({
      memberEmail: member.userEmail || member.email || member.memberEmail,
      memberName: member.userName || member.displayName || member.userEmail || member.email || member.memberEmail,
      role: member.projectRole || member.role || 'developer',
      badgeCategory: 'development',
      badgeLevel: 'novice',
      contribution: 'good',
      skillsDisplayed: [],
      adminNotes: ''
    }));
    
    console.log('📝 Generated evaluation form:', form);
    setEvaluationForm(form);
  };

  const initiateCompletion = async () => {
    try {
      setSubmitting(true);
      
      console.log('🚀 Initiating completion for group:', groupId);
      
      // Update group status
      await updateDoc(doc(db, 'groups', groupId), {
        'completionStatus.isReadyForCompletion': true,
        'completionStatus.completionInitiatedAt': serverTimestamp(),
        status: 'completing'
      });

      // Create completion request document
      const completionDoc = await addDoc(collection(db, 'project_completion_requests'), {
        groupId,
        adminEmail: currentUser.email,
        adminName: currentUser.displayName || currentUser.email,
        adminId: currentUser.uid,
        projectTitle: group.projectTitle,
        originalProjectId: group.originalProjectId,
        createdAt: serverTimestamp(),
        status: 'evaluation_phase',
        phase: 'evaluation',
        
        evaluationForm: {
          submittedAt: null,
          memberEvaluations: []
        },
        
        adminApproval: {
          approved: false,
          approvedAt: null,
          approvedBy: null,
          rejectedAt: null,
          rejectedBy: null,
          rejectionReason: null
        },
        
        finalCompletion: {
          completed: false,
          completedAt: null,
          certificatesGenerated: false,
          badgesAwarded: false
        },
        
        teamSize: members.length,
        teamMembers: members.map(member => ({
          memberName: member.userName,
          memberEmail: member.userEmail,
          role: member.projectRole || member.role,
          joinedAt: member.joinedAt
        }))
      });

      setCompletionData({ id: completionDoc.id });
      setCurrentStep(2);
      initializeEvaluationForm(members);
      
      console.log('✅ Completion initiated successfully');
      toast.success('Project completion initiated! Please evaluate team members.');
      
    } catch (error) {
      console.error('❌ Error initiating completion:', error);
      toast.error('Error initiating project completion: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const updateEvaluation = (index, field, value) => {
    const updated = [...evaluationForm];
    updated[index] = { ...updated[index], [field]: value };
    setEvaluationForm(updated);
  };

  const addSkill = (index, skill) => {
    if (!skill.trim()) return;
    const updated = [...evaluationForm];
    if (!updated[index].skillsDisplayed.includes(skill)) {
      updated[index].skillsDisplayed.push(skill);
      setEvaluationForm(updated);
    }
  };

  const removeSkill = (index, skillToRemove) => {
    const updated = [...evaluationForm];
    updated[index].skillsDisplayed = updated[index].skillsDisplayed.filter(skill => skill !== skillToRemove);
    setEvaluationForm(updated);
  };

  // Handle solo project completion (no team members to evaluate)
  const completeSoloProject = async () => {
    try {
      setSubmitting(true);
      
      console.log('🏆 Completing solo project...');

      // Generate admin certificate (no team badges since no team members)
      const certificateDoc = await addDoc(collection(db, 'certificates'), {
        type: 'project_owner',
        recipientEmail: currentUser.email,
        recipientName: currentUser.displayName || currentUser.email,
        projectTitle: group.projectTitle,
        groupId: groupId,
        generatedAt: serverTimestamp(),
        certificateData: {
          projectDescription: group.description,
          completionDate: new Date().toISOString(),
          teamSize: 1, // Solo project
          isSoloProject: true
        }
      });

      setAdminCertificate({
        id: certificateDoc.id,
        type: 'project_owner',
        recipientEmail: currentUser.email,
        recipientName: currentUser.displayName || currentUser.email,
        projectTitle: group.projectTitle,
        groupId: groupId,
        generatedAt: { toDate: () => new Date() },
        certificateData: {
          projectDescription: group.description,
          completionDate: new Date().toISOString(),
          teamSize: 1,
          isSoloProject: true
        }
      });

      // Update or create completion request as fully completed
      if (completionData?.id) {
        await updateDoc(doc(db, 'project_completion_requests', completionData.id), {
          'evaluationForm.memberEvaluations': [], // No team members
          'finalCompletion.completed': true,
          'finalCompletion.completedAt': serverTimestamp(),
          'finalCompletion.certificatesGenerated': true,
          'finalCompletion.badgesAwarded': false, // No badges since no team members
          'finalCompletion.isSoloProject': true,
          status: 'completed'
        });
      } else {
        // Create new completion request
        const newCompletionDoc = await addDoc(collection(db, 'project_completion_requests'), {
          groupId,
          adminEmail: currentUser.email,
          adminName: currentUser.displayName || currentUser.email,
          adminId: currentUser.uid,
          projectTitle: group.projectTitle,
          originalProjectId: group.originalProjectId,
          createdAt: serverTimestamp(),
          status: 'completed',
          
          evaluationForm: {
            submittedAt: serverTimestamp(),
            memberEvaluations: [] // No team members
          },
          
          adminApproval: {
            approved: true,
            approvedAt: serverTimestamp(),
            approvedBy: 'project_submission_approved'
          },
          
          finalCompletion: {
            completed: true,
            completedAt: serverTimestamp(),
            certificatesGenerated: true,
            badgesAwarded: false, // No badges since no team members
            isSoloProject: true
          },
          
          teamSize: 1,
          teamMembers: []
        });
        
        setCompletionData({ id: newCompletionDoc.id });
      }

      // Update group to completed status
      await updateDoc(doc(db, 'groups', groupId), {
        'completionStatus.completionFormSubmittedAt': serverTimestamp(),
        'completionStatus.completedAt': serverTimestamp(),
        'completionStatus.certificatesGenerated': true,
        'completionStatus.isSoloProject': true,
        status: 'completed'
      });

      // Update the original project status
      if (group.originalProjectId) {
        try {
          await updateDoc(doc(db, 'client_projects', group.originalProjectId), {
            status: 'completed',
            completedAt: serverTimestamp(),
            completedBy: currentUser.email,
            groupId: groupId,
            isActive: false,
            availableForApplications: false,
            projectClosed: true,
            isSoloProject: true
          });
          
          console.log('✅ Original project status updated');
          toast.success('🎉 Solo project completed and removed from public listing!');
        } catch (error) {
          console.error('❌ Error updating original project:', error);
          toast.warning('Project completed but may still appear in listing');
        }
      } else {
        toast.success('🎉 Solo project completed successfully!');
      }

      setCurrentStep(3);
      
    } catch (error) {
      console.error('❌ Error completing solo project:', error);
      toast.error('Error completing solo project: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  // FIXED: Submit evaluation for admin approval
  const submitForAdminApproval = async () => {
    try {
      console.log('📝 Submitting evaluation for admin approval...');
      
      // Validate form
      if (evaluationForm.length === 0) {
        toast.error('No team members to evaluate');
        return;
      }
      
      const incomplete = evaluationForm.some(member => 
        !member.badgeCategory || !member.badgeLevel || !member.contribution
      );
      
      if (incomplete) {
        toast.error('Please complete all member evaluations');
        return;
      }

      setSubmitting(true);

      console.log('📋 Evaluation form data:', evaluationForm);
      console.log('📋 Completion data ID:', completionData?.id);

      // Check if completion request exists
      if (!completionData?.id) {
        throw new Error('No completion request found. Please initiate completion first.');
      }

      // Update completion request with evaluation for admin review
      const updateData = {
        'evaluationForm.submittedAt': serverTimestamp(),
        'evaluationForm.memberEvaluations': evaluationForm,
        status: 'pending_admin_approval',
        phase: 'admin_review',
        submittedForApprovalAt: serverTimestamp()
      };

      console.log('📤 Updating completion request with:', updateData);

      await updateDoc(doc(db, 'project_completion_requests', completionData.id), updateData);

      // Create notification for admins
      await addDoc(collection(db, 'notifications'), {
        recipientType: 'admin',
        type: 'project_completion_review',
        title: 'New Project Completion for Review',
        message: `Project "${group.projectTitle}" has been submitted for completion approval by ${currentUser.displayName || currentUser.email}`,
        groupId: groupId,
        projectTitle: group.projectTitle,
        requestId: completionData.id,
        requestedBy: currentUser.email,
        teamSize: evaluationForm.length + 1, // +1 for project owner
        createdAt: serverTimestamp(),
        read: false,
        priority: 'normal'
      });

      // Update local state
      setCompletionData(prev => ({
        ...prev,
        status: 'pending_admin_approval',
        evaluationForm: {
          submittedAt: new Date(),
          memberEvaluations: evaluationForm
        }
      }));

      setCurrentStep(3);
      
      console.log('✅ Evaluation submitted successfully');
      toast.success('🎯 Evaluation submitted for admin approval! You will be notified when approved.');
      
    } catch (error) {
      console.error('❌ Error submitting for admin approval:', error);
      toast.error('Error submitting evaluation: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  // 🔥 UPDATED: processBadgesAndCertificates function with EMAIL NOTIFICATIONS
  const processBadgesAndCertificates = async () => {
    try {
      console.log('🏅 Processing badges and certificates with email notifications...');
      
      const emailResults = []; // Track email sending results
      let badgesAwarded = 0;
      let emailsSuccessful = 0;
      let emailsFailed = 0;
      
      // Award badges to members with email notifications
      for (const member of evaluationForm) {
        try {
          console.log(`🏆 Processing badge for member: ${member.memberName}`);
          
          // Create badge document in Firestore
          const badgeDoc = await addDoc(collection(db, 'member_badges'), {
            memberEmail: member.memberEmail,
            memberName: member.memberName,
            badgeCategory: member.badgeCategory,
            badgeLevel: member.badgeLevel,
            projectTitle: group.projectTitle,
            groupId: groupId,
            awardedAt: serverTimestamp(),
            awardedBy: currentUser.email,
            awardedByName: currentUser.displayName || currentUser.email.split('@')[0],
            contribution: member.contribution,
            skillsDisplayed: member.skillsDisplayed || [],
            adminNotes: member.adminNotes || '',
            // Additional metadata
            originalProjectId: group.originalProjectId,
            teamSize: evaluationForm.length + 1, // +1 for project owner
            projectCompletedAt: serverTimestamp()
          });
          
          console.log(`✅ Badge document created for ${member.memberName}:`, badgeDoc.id);
          badgesAwarded++;
          
          // 🔥 NEW: Send badge award email notification
          try {
            console.log(`📧 Sending badge award email to: ${member.memberEmail}`);
            
            const emailData = {
              badgeData: {
                badgeCategory: member.badgeCategory,
                badgeLevel: member.badgeLevel,
                contribution: member.contribution,
                skillsDisplayed: member.skillsDisplayed || [],
                adminNotes: member.adminNotes || '',
                badgeId: badgeDoc.id,
                awardedAt: new Date().toISOString()
              },
              memberData: {
                memberEmail: member.memberEmail,
                memberName: member.memberName,
                memberRole: member.role || 'Team Member',
                additionalEmails: [] // Can be expanded if needed
              },
              projectData: {
                projectTitle: group.projectTitle,
                contactName: currentUser.displayName || currentUser.email.split('@')[0] || 'Project Owner',
                contactEmail: currentUser.email,
                companyName: group.companyName || 'Team Project',
                projectType: group.projectType || 'Collaborative Project',
                teamSize: evaluationForm.length + 1,
                groupId: groupId,
                originalProjectId: group.originalProjectId || null,
                description: group.description || group.projectDescription || '',
                completionDate: new Date().toISOString()
              }
            };

            const emailResult = await sendEmailNotification('send-badge-awarded', emailData);
            
            if (emailResult.success) {
              console.log(`✅ Badge award email sent successfully to ${member.memberName}`);
              emailsSuccessful++;
              emailResults.push({
                member: member.memberName,
                email: member.memberEmail,
                status: 'success',
                messageId: emailResult.results?.[0]?.messageId
              });
            } else {
              console.warn(`⚠️ Badge award email failed for ${member.memberName}:`, emailResult.error);
              emailsFailed++;
              emailResults.push({
                member: member.memberName,
                email: member.memberEmail,
                status: 'failed',
                error: emailResult.error
              });
            }
            
          } catch (emailError) {
            console.error(`❌ Email notification error for ${member.memberName}:`, emailError);
            emailsFailed++;
            emailResults.push({
              member: member.memberName,
              email: member.memberEmail,
              status: 'error',
              error: emailError.message
            });
          }
          
          // Create Firebase notification for member (keep existing functionality)
          await addDoc(collection(db, 'notifications'), {
            recipientEmail: member.memberEmail,
            recipientName: member.memberName,
            recipientId: member.memberId || null,
            type: 'badge_awarded',
            title: 'TechTalent Badge Awarded! 🏆',
            message: `You've been awarded a ${member.badgeCategory} badge (${member.badgeLevel} level) for your contribution to "${group.projectTitle}"`,
            groupId: groupId,
            badgeId: badgeDoc.id,
            badgeCategory: member.badgeCategory,
            badgeLevel: member.badgeLevel,
            projectTitle: group.projectTitle,
            awardedBy: currentUser.email,
            awardedByName: currentUser.displayName || currentUser.email.split('@')[0],
            createdAt: serverTimestamp(),
            read: false,
            priority: 'high'
          });
          
          console.log(`✅ Firebase notification created for ${member.memberName}`);
          
        } catch (memberError) {
          console.error(`❌ Error processing badge for ${member.memberName}:`, memberError);
          emailResults.push({
            member: member.memberName,
            email: member.memberEmail,
            status: 'failed',
            error: `Badge creation failed: ${memberError.message}`
          });
          // Continue with other members even if one fails
        }
      }

      // Generate admin certificate (existing functionality)
      console.log('📜 Generating project owner certificate...');
      const certificateDoc = await addDoc(collection(db, 'certificates'), {
        type: 'project_owner',
        recipientEmail: currentUser.email,
        recipientName: currentUser.displayName || currentUser.email,
        recipientId: currentUser.uid,
        projectTitle: group.projectTitle,
        groupId: groupId,
        generatedAt: serverTimestamp(),
        certificateData: {
          projectDescription: group.description || group.projectDescription || '',
          completionDate: new Date().toISOString(),
          teamSize: evaluationForm.length + 1, // +1 for project owner
          badgesAwarded: badgesAwarded,
          originalProjectId: group.originalProjectId || null,
          projectType: group.projectType || 'Collaborative Project'
        }
      });

      setAdminCertificate({
        id: certificateDoc.id,
        type: 'project_owner',
        recipientEmail: currentUser.email,
        recipientName: currentUser.displayName || currentUser.email,
        projectTitle: group.projectTitle,
        groupId: groupId,
        generatedAt: { toDate: () => new Date() },
        certificateData: {
          projectDescription: group.description || group.projectDescription || '',
          completionDate: new Date().toISOString(),
          teamSize: evaluationForm.length + 1,
          badgesAwarded: badgesAwarded
        }
      });

      console.log('✅ Project owner certificate generated');

      // Summary of processing results
      console.log('📊 Badge Processing Summary:', {
        totalMembers: evaluationForm.length,
        badgesAwarded: badgesAwarded,
        emailsSuccessful: emailsSuccessful,
        emailsFailed: emailsFailed,
        certificateGenerated: true
      });

      // Show success message with email results
      if (emailsSuccessful === evaluationForm.length) {
        toast.success(`🎉 All ${badgesAwarded} badges awarded successfully!\n\n📧 Email notifications sent to all team members\n📜 Your project owner certificate has been generated`);
      } else if (emailsSuccessful > 0) {
        toast.success(`🎉 ${badgesAwarded} badges awarded successfully!\n\n📧 ${emailsSuccessful}/${evaluationForm.length} email notifications sent\n⚠️ ${emailsFailed} email(s) failed to send\n📜 Your certificate has been generated`);
      } else {
        toast.success(`🎉 ${badgesAwarded} badges awarded successfully!\n\n⚠️ All email notifications failed to send\n💡 Team members will see badges in their profiles\n📜 Your certificate has been generated`);
      }

      // Log detailed email results for debugging
      if (emailResults.length > 0) {
        console.log('📧 Detailed Email Results:', emailResults);
      }

      console.log('✅ All badges, certificates, and notifications processed successfully');

    } catch (error) {
      console.error('❌ Error processing badges and certificates:', error);
      toast.error('Error processing badges and certificates: ' + error.message);
      throw error;
    }
  };

  // MODIFIED: Final completion function (after admin approval)
  const finalizeProjectCompletion = async () => {
    try {
      setSubmitting(true);
      
      console.log('🏆 Finalizing project completion...');

      // Process badges and certificates with email notifications
      await processBadgesAndCertificates();

      // Update completion request as fully completed
      await updateDoc(doc(db, 'project_completion_requests', completionData.id), {
        'finalCompletion.completed': true,
        'finalCompletion.completedAt': serverTimestamp(),
        'finalCompletion.certificatesGenerated': true,
        'finalCompletion.badgesAwarded': true,
        status: 'completed'
      });

      // Update group to completed status
      await updateDoc(doc(db, 'groups', groupId), {
        'completionStatus.completionFormSubmittedAt': serverTimestamp(),
        'completionStatus.completedAt': serverTimestamp(),
        'completionStatus.certificatesGenerated': true,
        status: 'completed'
      });

      // Update the original project status
      if (group.originalProjectId) {
        try {
          await updateDoc(doc(db, 'client_projects', group.originalProjectId), {
            status: 'completed',
            completedAt: serverTimestamp(),
            completedBy: currentUser.email,
            groupId: groupId,
            isActive: false,
            availableForApplications: false,
            projectClosed: true
          });
          
          console.log('✅ Original project status updated');
          toast.success('🎉 Project completed and removed from public listing!');
        } catch (error) {
          console.error('❌ Error updating original project:', error);
          toast.warning('Project completed but may still appear in listing');
        }
      }

      setCurrentStep(4);
      
    } catch (error) {
      console.error('❌ Error finalizing project completion:', error);
      toast.error('Error completing project finalization: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-lime-400 mx-auto mb-4"></div>
          <p>Loading completion data...</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen overflow-hidden flex flex-col relative"
      style={{
        backgroundImage: `url('/Images/backg.png')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed'
      }}
    >
      {/* Animated background overlay */}
      <div 
        className="fixed inset-0 opacity-30 pointer-events-none"
        style={{
          background: `radial-gradient(400px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(76, 175, 80, 0.1), transparent 40%)`
        }}
      />
      
      {/* Header - Enhanced with glassmorphism effect */}
      <header className="fixed top-0 left-0 right-0 z-50" 
              style={{background: 'linear-gradient(135deg, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.7) 50%, transparent 100%)'}}>
        <div className="container mx-auto px-4 sm:px-6 py-3 sm:py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Link to="/" className="flex items-center group">
                <img 
                  src="/Images/512X512.png" 
                  alt="Favored Online Logo" 
                  className="w-8 h-8 sm:w-10 sm:h-10 mr-2 sm:mr-4 transform group-hover:scale-110 transition-transform duration-300"
                />
                <span className="text-lg sm:text-2xl font-black text-white tracking-wide" 
                      style={{
                        textShadow: '0 0 20px rgba(76, 175, 80, 0.5), 2px 2px 4px rgba(0,0,0,0.8)',
                        fontFamily: '"Inter", sans-serif'
                      }}>
                  Favored Online
                </span>
              </Link>
            </div>
            
            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-6 lg:space-x-10">
              {/* HOME LINK - Different destinations for logged in vs logged out users */}
              <Link 
                to={currentUser ? "/community" : "/"} 
                className="text-white/90 hover:text-lime-400 font-semibold transition-all duration-300 relative group text-sm lg:text-base" 
                style={{textShadow: '1px 1px 2px rgba(0,0,0,0.8)'}}
              >
                Home
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-lime-400 to-green-500 group-hover:w-full transition-all duration-300"></span>
              </Link>
              
              {/* LOGGED IN USER NAVIGATION */}
              {currentUser ? (
                <>
                  {/* MY CAREER LINK - Only for logged in users */}
                  <Link to="/career/dashboard" className="text-white/90 hover:text-lime-400 font-semibold transition-all duration-300 relative group text-sm lg:text-base" 
                        style={{textShadow: '1px 1px 2px rgba(0,0,0,0.8)'}}>
                    My Career
                    <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-lime-400 to-green-500 group-hover:w-full transition-all duration-300"></span>
                  </Link>
                  
                  {/* DASHBOARD LINK - Only for logged in users */}
                  <Link to="/dashboard" className="text-white/90 hover:text-lime-400 font-semibold transition-all duration-300 relative group text-sm lg:text-base" 
                        style={{textShadow: '1px 1px 2px rgba(0,0,0,0.8)'}}>
                    Dashboard
                    <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-lime-400 to-green-500 group-hover:w-full transition-all duration-300"></span>
                  </Link>
                </>
              ) : (
                /* LOGGED OUT USER NAVIGATION */
                <Link to="/career" className="text-white/90 hover:text-lime-400 font-semibold transition-all duration-300 relative group text-sm lg:text-base" 
                      style={{textShadow: '1px 1px 2px rgba(0,0,0,0.8)'}}>
                  Career
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-lime-400 to-green-500 group-hover:w-full transition-all duration-300"></span>
                </Link>
              )}
              
              {/* USER AUTHENTICATION SECTION */}
              {currentUser ? (
                <div className="flex items-center space-x-2 lg:space-x-4">
                  <div className="flex items-center bg-black/30 backdrop-blur-sm rounded-full px-2 sm:px-4 py-1 sm:py-2 border border-white/20">
                    {currentUser.photoURL && (
                      <img src={currentUser.photoURL} alt="Profile" className="w-6 h-6 sm:w-8 sm:h-8 rounded-full mr-2 sm:mr-3 ring-2 ring-lime-400/50" />
                    )}
                    <span className="text-xs sm:text-sm text-white font-medium truncate max-w-20 sm:max-w-none" 
                          style={{textShadow: '1px 1px 2px rgba(0,0,0,0.8)'}}>
                      {currentUser.displayName || currentUser.email}
                    </span>
                  </div>
                  <button 
                    onClick={() => navigate('/logout')} 
                    className="bg-white/10 hover:bg-white/20 text-white px-3 sm:px-6 py-1 sm:py-2 rounded-full text-xs sm:text-sm transition-all duration-300 backdrop-blur-sm border border-white/20 font-medium"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <button 
                  onClick={() => navigate('/login')} 
                  className="bg-gradient-to-r from-lime-500 to-green-600 hover:from-lime-600 hover:to-green-700 text-white px-4 sm:px-8 py-2 sm:py-3 rounded-full text-xs sm:text-sm font-bold transition-all duration-300 transform hover:scale-105 flex items-center shadow-2xl hover:shadow-lime-500/25"
                >
                  <span className="mr-1 sm:mr-2 text-sm sm:text-lg">🚀</span>
                  Get Started
                </button>
              )}
            </nav>
            
            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <button 
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)} 
                className="text-white hover:text-lime-400 focus:outline-none p-2 rounded-lg bg-black/30 backdrop-blur-sm border border-white/20 transition-all duration-300"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={mobileMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
                </svg>
              </button>
            </div>
          </div>
          
          {/* Enhanced Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden mt-4 sm:mt-6 pb-4 sm:pb-6 rounded-2xl" 
                 style={{background: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(20px)'}}>
              <div className="flex flex-col space-y-3 sm:space-y-5 p-4 sm:p-6">
                
                {/* HOME LINK FOR MOBILE - Different for logged in vs out */}
                <Link 
                  to={currentUser ? "/community" : "/"} 
                  className="text-white hover:text-lime-400 font-semibold transition-colors text-base sm:text-lg" 
                  style={{textShadow: '1px 1px 2px rgba(0,0,0,0.8)'}}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Home
                </Link>
                
                {/* LOGGED IN USER MOBILE NAVIGATION */}
                {currentUser ? (
                  <>
                    {/* MY CAREER LINK FOR MOBILE */}
                    <Link to="/career/dashboard" 
                          className="text-white hover:text-lime-400 font-semibold transition-colors text-base sm:text-lg" 
                          style={{textShadow: '1px 1px 2px rgba(0,0,0,0.8)'}}
                          onClick={() => setMobileMenuOpen(false)}>
                      My Career
                    </Link>

                    {/* DASHBOARD LINK FOR MOBILE */}
                    <Link to="/dashboard" 
                          className="text-white hover:text-lime-400 font-semibold transition-colors text-base sm:text-lg" 
                          style={{textShadow: '1px 1px 2px rgba(0,0,0,0.8)'}}
                          onClick={() => setMobileMenuOpen(false)}>
                      Dashboard
                    </Link>
                  </>
                ) : (
                  /* LOGGED OUT USER MOBILE NAVIGATION */
                  <Link to="/career" 
                        className="text-white hover:text-lime-400 font-semibold transition-colors text-base sm:text-lg" 
                        style={{textShadow: '1px 1px 2px rgba(0,0,0,0.8)'}}
                        onClick={() => setMobileMenuOpen(false)}>
                    Career
                  </Link>
                )}
                
                {/* MOBILE USER AUTHENTICATION SECTION */}
                {currentUser ? (
                  <div className="flex flex-col space-y-3 sm:space-y-4 pt-3 sm:pt-4 border-t border-white/20">
                    <div className="flex items-center bg-black/40 rounded-full px-3 sm:px-4 py-2 sm:py-3">
                      {currentUser.photoURL && (
                        <img src={currentUser.photoURL} alt="Profile" className="w-6 h-6 sm:w-8 sm:h-8 rounded-full mr-2 sm:mr-3 ring-2 ring-lime-400/50" />
                      )}
                      <span className="text-xs sm:text-sm text-white font-medium truncate">{currentUser.displayName || currentUser.email}</span>
                    </div>
                    <button 
                      onClick={() => navigate('/logout')} 
                      className="bg-white/10 hover:bg-white/20 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-full text-sm transition-colors w-full font-medium"
                    >
                      Logout
                    </button>
                  </div>
                ) : (
                  <button 
                    onClick={() => navigate('/login')} 
                    className="bg-gradient-to-r from-lime-500 to-green-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-full text-sm font-bold transition-all flex items-center justify-center shadow-xl"
                  >
                    <span className="mr-2">🚀</span>
                    Get Started
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow pt-20 md:pt-24 pb-16">
        <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 max-w-6xl">
          
          {/* Hero Section */}
          <section className="text-center mb-8 sm:mb-12">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black mb-4 sm:mb-6">
              Project <span className="text-transparent bg-clip-text bg-gradient-to-r from-lime-300 via-green-400 to-emerald-500">Completion</span>
            </h1>
            
            <div className="bg-gradient-to-br from-black/40 via-gray-900/40 to-black/40 backdrop-blur-2xl rounded-2xl p-4 sm:p-6 border border-white/20 max-w-4xl mx-auto">
              <h2 className="text-xl sm:text-2xl font-bold text-white mb-3 sm:mb-4">{group?.projectTitle}</h2>
              
              {/* Completion status */}
              <div className="p-3 sm:p-4 bg-gray-800/40 rounded-xl">
                <h3 className="text-base sm:text-lg font-bold text-blue-400 mb-2">🔍 Project Status</h3>
                <div className="text-xs sm:text-sm text-gray-300 space-y-1">
                  <div>Current Step: {currentStep}/3</div>
                  <div>Status: {completionData?.status || 'Not Started'}</div>
                  {completionData?.adminApproval && (
                    <div>Admin Approval: {completionData.adminApproval.approved ? '✅ APPROVED' : '⏳ PENDING'}</div>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* Progress Steps - RESPONSIVE VERSION */}
          <section className="mb-8 sm:mb-12">
            <div className="flex justify-center px-4">
              <div className="flex items-center justify-center w-full max-w-4xl">
                {/* Mobile: Vertical Layout */}
                <div className="block sm:hidden w-full space-y-4">
                  {[
                    { step: 1, title: 'Project Approval', icon: '🔍' },
                    { step: 2, title: 'Assign Badges', icon: '🏆' },
                    { step: 3, title: 'Complete', icon: '🎉' }
                  ].map((item) => (
                    <div key={item.step} className="flex items-center bg-black/20 backdrop-blur-sm rounded-xl p-3 border border-white/10">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold border-2 transition-all duration-300 flex-shrink-0 ${
                        currentStep >= item.step 
                          ? 'bg-lime-500 border-lime-500 text-black' 
                          : 'bg-gray-700 border-gray-500 text-gray-300'
                      }`}>
                        {currentStep > item.step ? '✓' : item.icon}
                      </div>
                      <div className="ml-4 flex-1">
                        <div className="font-semibold text-white text-sm">
                          Step {item.step}: {item.title}
                        </div>
                        <div className="text-xs text-gray-400">
                          {currentStep >= item.step ? 'Completed' : 
                           currentStep === item.step ? 'In Progress' : 'Pending'}
                        </div>
                      </div>
                      {currentStep >= item.step && (
                        <div className="text-lime-400 text-xl flex-shrink-0">✓</div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Tablet & Desktop: Horizontal Layout */}
                <div className="hidden sm:flex items-center justify-center space-x-2 sm:space-x-4 lg:space-x-8 w-full">
                  {[
                    { step: 1, title: 'Project Approval', icon: '🔍' },
                    { step: 2, title: 'Assign Badges', icon: '🏆' },
                    { step: 3, title: 'Complete', icon: '🎉' }
                  ].map((item) => (
                    <div key={item.step} className="flex items-center">
                      <div className="flex flex-col items-center">
                        <div className={`w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 rounded-full flex items-center justify-center text-sm sm:text-lg lg:text-xl font-bold border-2 transition-all duration-300 ${
                          currentStep >= item.step 
                            ? 'bg-lime-500 border-lime-500 text-black shadow-lg shadow-lime-500/50' 
                            : 'bg-gray-700 border-gray-500 text-gray-300'
                        }`}>
                          {currentStep > item.step ? '✓' : item.icon}
                        </div>
                        <div className="mt-2 text-center">
                          <div className="font-semibold text-white text-xs sm:text-sm lg:text-base whitespace-nowrap">
                            {item.title}
                          </div>
                          <div className={`text-xs text-center mt-1 transition-colors duration-300 ${
                            currentStep >= item.step ? 'text-lime-400' :
                            currentStep === item.step ? 'text-yellow-400' : 'text-gray-500'
                          }`}>
                            {currentStep >= item.step ? 'Completed' : 
                             currentStep === item.step ? 'Current' : 'Pending'}
                          </div>
                        </div>
                      </div>
                      
                      {/* Connector Line */}
                      {item.step < 3 && (
                        <div className={`h-0.5 w-4 sm:w-8 lg:w-16 mx-2 sm:mx-4 lg:mx-6 transition-all duration-500 ${
                          currentStep > item.step ? 'bg-lime-500 shadow-sm shadow-lime-500/50' : 'bg-gray-600'
                        }`}></div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Step 1: Waiting for Project Approval - RESPONSIVE */}
          {currentStep === 1 && (
            <section className="max-w-4xl mx-auto px-4">
              <div className="bg-gradient-to-br from-black/40 via-gray-900/40 to-black/40 backdrop-blur-2xl rounded-2xl p-4 sm:p-6 lg:p-8 border border-white/20">
                <div className="text-center mb-6 sm:mb-8">
                  <div className="text-4xl sm:text-5xl lg:text-6xl mb-4 sm:mb-6">⏳</div>
                  <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold text-yellow-400 mb-3 sm:mb-4 px-2">
                    Waiting for Project Approval
                  </h3>
                  <p className="text-sm sm:text-base text-gray-200 mb-4 sm:mb-6 px-2">
                    Your project is currently under admin review. Once approved, you'll be able to assign badges to your team members.
                  </p>
                </div>

                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 sm:p-6 mb-6 sm:mb-8">
                  <h4 className="text-yellow-400 font-bold text-base sm:text-lg mb-2 sm:mb-3">📋 Project Review Status</h4>
                  <div className="text-gray-300 space-y-1 sm:space-y-2 text-sm sm:text-base">
                    <p>• Project has been submitted for admin review</p>
                    <p>• Admin is verifying GitHub repository and project quality</p>
                    <p>• You will be notified when the review is complete</p>
                    <p>• Once approved, you can assign TechTalent badges to team members</p>
                  </div>
                </div>

                <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 sm:p-6">
                  <h4 className="text-blue-400 font-bold mb-2 sm:mb-3 text-sm sm:text-base">📧 What happens next:</h4>
                  <ul className="space-y-1 sm:space-y-2 text-gray-200 text-xs sm:text-sm">
                    <li>• Admin reviews the submitted project work and GitHub repository</li>
                    <li>• They verify that requirements are met (public repo, team credits, etc.)</li>
                    <li>• You will receive an email notification when approved</li>
                    <li>• Return to this page to assign badges to your team members</li>
                  </ul>
                </div>

                <div className="text-center mt-6 sm:mt-8">
                  <button
                    onClick={() => window.location.reload()}
                    className="bg-gray-600 hover:bg-gray-700 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-semibold transition-colors text-sm sm:text-base w-full sm:w-auto"
                  >
                    🔄 Check Approval Status
                  </button>
                </div>
              </div>
            </section>
          )}

          {/* Step 2: Badge Assignment (After Admin Approval) - RESPONSIVE */}
          {currentStep === 2 && (
            <section className="max-w-6xl mx-auto">
              <div className="bg-gradient-to-br from-black/40 via-gray-900/40 to-black/40 backdrop-blur-2xl rounded-2xl p-4 sm:p-6 lg:p-8 border border-white/20">
                <div className="text-center mb-6 sm:mb-8">
                  <div className="text-4xl sm:text-5xl lg:text-6xl mb-4 sm:mb-6">✅</div>
                  <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold text-green-400 mb-3 sm:mb-4">Project Approved!</h3>
                  <p className="text-sm sm:text-base text-gray-200 mb-4 sm:mb-6 px-2">
                    Your project has been approved by admin. You can now assign badges to your team members.
                  </p>
                </div>

                {evaluationForm.length === 0 ? (
                  // No team members to evaluate - RESPONSIVE
                  <div className="text-center py-8 sm:py-16">
                    <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-2xl p-4 sm:p-6 lg:p-8 max-w-2xl mx-auto">
                      <div className="text-4xl sm:text-5xl lg:text-6xl mb-4 sm:mb-6">👤</div>
                      <h3 className="text-xl sm:text-2xl font-bold text-yellow-400 mb-3 sm:mb-4 px-2">No Team Members to Evaluate</h3>
                      <div className="text-gray-300 space-y-3 sm:space-y-4 mb-6 sm:mb-8 text-sm sm:text-base">
                        <p className="px-2">It looks like you're the only member in this project group, or all team members have already left.</p>
                        
                        <div className="bg-gray-800/40 rounded-xl p-3 sm:p-4">
                          <h4 className="text-white font-semibold mb-2 text-sm sm:text-base">Debug Information:</h4>
                          <div className="text-xs sm:text-sm text-gray-400 space-y-1 text-left">
                            <div className="break-words">Total Group Members: {members.length}</div>
                            <div className="break-words">Your Email: {currentUser.email}</div>
                            <div className="break-words">Team Members: {members.map(m => m.userName || m.userEmail).join(', ') || 'None'}</div>
                          </div>
                        </div>
                        
                        <div className="space-y-2 text-left">
                          <p className="font-semibold text-white text-sm sm:text-base">Options:</p>
                          <ul className="space-y-1 text-xs sm:text-sm">
                            <li>• Complete the project as a solo project</li>
                            <li>• Go back and invite more team members</li>
                            <li>• Check if team members are still active in the group</li>
                          </ul>
                        </div>
                      </div>
                      
                      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
                        <button
                          onClick={completeSoloProject}
                          disabled={submitting}
                          className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-6 sm:px-8 py-2 sm:py-3 rounded-xl font-bold transition-all duration-300 transform hover:scale-105 disabled:opacity-50 text-sm sm:text-base order-2 sm:order-1"
                        >
                          {submitting ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-b-2 border-white mr-2 sm:mr-3 inline-block"></div>
                              Completing...
                            </>
                          ) : (
                            '🏆 Complete Solo Project'
                          )}
                        </button>
                        
                        <Link 
                          to={`/groups/${groupId}`}
                          className="bg-gray-600 hover:bg-gray-700 text-white px-6 sm:px-8 py-2 sm:py-3 rounded-xl font-bold transition-colors text-center text-sm sm:text-base order-1 sm:order-2"
                        >
                          ← Back to Group
                        </Link>
                      </div>
                    </div>
                  </div>
                ) : (
                  // Has team members to evaluate - RESPONSIVE
                  <>
                    <h3 className="text-xl sm:text-2xl font-bold text-white mb-4 sm:mb-6 text-center">Assign Team Member Badges</h3>
                    <p className="text-center text-gray-300 mb-6 sm:mb-8 text-sm sm:text-base px-2">
                      Assign badges to your team members based on their contributions to the project.
                    </p>
                    
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
                      {evaluationForm.map((member, index) => (
                        <div key={index} className="bg-gray-800/50 rounded-xl p-4 sm:p-6 border border-gray-600">
                          <div className="flex items-center mb-3 sm:mb-4">
                            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-base sm:text-lg mr-3 sm:mr-4 flex-shrink-0">
                              {member.memberName.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0 flex-1">
                              <h4 className="text-lg sm:text-xl font-bold text-white truncate">{member.memberName}</h4>
                              <p className="text-gray-400 text-xs sm:text-sm">{member.role}</p>
                            </div>
                          </div>
                          
                          <div className="space-y-3 sm:space-y-4">
                            {/* Badge Category */}
                            <div>
                              <label className="block text-white font-semibold mb-1 sm:mb-2 text-sm sm:text-base">Badge Category</label>
                              <select
                                value={member.badgeCategory}
                                onChange={(e) => updateEvaluation(index, 'badgeCategory', e.target.value)}
                                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 sm:px-4 py-2 sm:py-3 text-white focus:border-lime-400 focus:outline-none text-sm sm:text-base"
                              >
                                {Object.entries(badgeCategories).map(([key, category]) => (
                                  <option key={key} value={key}>{category.name}</option>
                                ))}
                              </select>
                            </div>

                            {/* Badge Level */}
                            <div>
                              <label className="block text-white font-semibold mb-1 sm:mb-2 text-sm sm:text-base">Badge Level</label>
                              <select
                                value={member.badgeLevel}
                                onChange={(e) => updateEvaluation(index, 'badgeLevel', e.target.value)}
                                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 sm:px-4 py-2 sm:py-3 text-white focus:border-lime-400 focus:outline-none text-sm sm:text-base"
                              >
                                {badgeLevels.map(level => (
                                  <option key={level} value={level}>
                                    {level.charAt(0).toUpperCase() + level.slice(1)}
                                  </option>
                                ))}
                              </select>
                            </div>

                            {/* Contribution Level */}
                            <div>
                              <label className="block text-white font-semibold mb-1 sm:mb-2 text-sm sm:text-base">Contribution Quality</label>
                              <select
                                value={member.contribution}
                                onChange={(e) => updateEvaluation(index, 'contribution', e.target.value)}
                                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 sm:px-4 py-2 sm:py-3 text-white focus:border-lime-400 focus:outline-none text-sm sm:text-base"
                              >
                                {contributionLevels.map(level => (
                                  <option key={level} value={level}>
                                    {level.charAt(0).toUpperCase() + level.slice(1)}
                                  </option>
                                ))}
                              </select>
                            </div>

                            {/* Skills Displayed */}
                            <div>
                              <label className="block text-white font-semibold mb-1 sm:mb-2 text-sm sm:text-base">Skills Demonstrated</label>
                              <div className="space-y-2">
                                <input
                                  type="text"
                                  placeholder="Add a skill (press Enter)"
                                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 sm:px-4 py-2 text-white focus:border-lime-400 focus:outline-none text-sm sm:text-base"
                                  onKeyPress={(e) => {
                                    if (e.key === 'Enter') {
                                      e.preventDefault();
                                      addSkill(index, e.target.value);
                                      e.target.value = '';
                                    }
                                  }}
                                />
                                <div className="flex flex-wrap gap-1 sm:gap-2">
                                  {member.skillsDisplayed.map((skill, skillIndex) => (
                                    <span
                                      key={skillIndex}
                                      className="bg-lime-500/20 text-lime-300 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm flex items-center"
                                    >
                                      <span className="truncate max-w-20 sm:max-w-none">{skill}</span>
                                      <button
                                        onClick={() => removeSkill(index, skill)}
                                        className="ml-1 sm:ml-2 text-lime-400 hover:text-white flex-shrink-0"
                                      >
                                        ×
                                      </button>
                                    </span>
                                  ))}
                                </div>
                              </div>
                            </div>

                            {/* Admin Notes */}
                            <div>
                              <label className="block text-white font-semibold mb-1 sm:mb-2 text-sm sm:text-base">Notes (Optional)</label>
                              <textarea
                                value={member.adminNotes}
                                onChange={(e) => updateEvaluation(index, 'adminNotes', e.target.value)}
                                placeholder="Additional notes about this member's contribution..."
                                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 sm:px-4 py-2 sm:py-3 text-white focus:border-lime-400 focus:outline-none text-sm sm:text-base resize-none"
                                rows={2}
                              />
                            </div>

                            {/* Preview Badge */}
                            <div className="bg-gradient-to-r from-gray-700/50 to-gray-800/50 rounded-lg p-2 sm:p-3 border border-gray-600">
                              <div className="flex items-center">
                                <img 
                                  src={badgeCategories[member.badgeCategory].image} 
                                  alt={badgeCategories[member.badgeCategory].name}
                                  className="w-6 h-6 sm:w-8 sm:h-8 mr-2 sm:mr-3 flex-shrink-0"
                                />
                                <div className="min-w-0 flex-1">
                                  <div className="text-white font-semibold text-xs sm:text-sm truncate">
                                    {badgeCategories[member.badgeCategory].name}
                                  </div>
                                  <div className="text-gray-400 text-xs">
                                    {member.badgeLevel.charAt(0).toUpperCase() + member.badgeLevel.slice(1)} Level
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-6 sm:mt-8 text-center">
                      <button
                        onClick={finalizeProjectCompletion}
                        disabled={submitting}
                        className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-8 sm:px-12 py-3 sm:py-4 rounded-xl font-bold text-base sm:text-lg transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
                      >
                        {submitting ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-b-2 border-white mr-2 sm:mr-3 inline-block"></div>
                            Awarding Badges & Sending Emails...
                          </>
                        ) : (
                          '🏆 Award Badges & Complete Project'
                        )}
                      </button>
                    </div>
                  </>
                )}
              </div>
            </section>
          )}

          {/* Step 3: Completion Success - RESPONSIVE */}
          {currentStep === 3 && (
            <section className="max-w-4xl mx-auto">
              <div className="bg-gradient-to-br from-black/40 via-gray-900/40 to-black/40 backdrop-blur-2xl rounded-2xl p-4 sm:p-6 lg:p-8 border border-white/20">
                <div className="text-center mb-6 sm:mb-8">
                  <div className="text-4xl sm:text-5xl lg:text-6xl mb-4 sm:mb-6">🎉</div>
                  <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-3 sm:mb-4">Project Completed Successfully!</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-8">
                    <div className="bg-green-500/20 border border-green-500/40 rounded-xl p-3 sm:p-4">
                      <div className="text-green-400 text-xl sm:text-2xl mb-2">🏆</div>
                      <h4 className="text-green-400 font-semibold text-sm sm:text-base">
                        {evaluationForm.length > 0 ? 'Badges Awarded' : 'Solo Project'}
                      </h4>
                      <p className="text-gray-300 text-xs sm:text-sm">
                        {evaluationForm.length > 0 ? `${evaluationForm.length} badges` : 'Completed'}
                      </p>
                    </div>
                    
                    <div className="bg-purple-500/20 border border-purple-500/40 rounded-xl p-3 sm:p-4">
                      <div className="text-purple-400 text-xl sm:text-2xl mb-2">📜</div>
                      <h4 className="text-purple-400 font-semibold text-sm sm:text-base">Certificates</h4>
                      <p className="text-gray-300 text-xs sm:text-sm">Generated</p>
                    </div>
                    
                    <div className="bg-blue-500/20 border border-blue-500/40 rounded-xl p-3 sm:p-4">
                      <div className="text-blue-400 text-xl sm:text-2xl mb-2">📧</div>
                      <h4 className="text-blue-400 font-semibold text-sm sm:text-base">Emails Sent</h4>
                      <p className="text-gray-300 text-xs sm:text-sm">
                        {evaluationForm.length > 0 ? 'Badge notifications' : 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Team Summary */}
                {evaluationForm.length > 0 ? (
                  <div className="bg-gray-800/40 rounded-xl p-4 sm:p-6 mb-6 sm:mb-8">
                    <h4 className="text-white font-bold text-base sm:text-lg mb-3 sm:mb-4">👥 Final Team Summary</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                      {evaluationForm.map((member, index) => (
                        <div key={index} className="bg-gray-700/50 rounded-lg p-3 sm:p-4">
                          <h5 className="text-white font-semibold text-sm sm:text-base truncate">{member.memberName}</h5>
                          <p className="text-gray-300 text-xs sm:text-sm">{member.role}</p>
                          <div className="mt-2 flex items-center">
                            <img 
                              src={badgeCategories[member.badgeCategory].image} 
                              alt={badgeCategories[member.badgeCategory].name}
                              className="w-5 h-5 sm:w-6 sm:h-6 mr-2 flex-shrink-0"
                            />
                            <div className="min-w-0 flex-1">
                              <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-xs block mb-1 truncate">
                                {badgeCategories[member.badgeCategory]?.name}
                              </span>
                              <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs block truncate">
                                {member.badgeLevel}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-800/40 rounded-xl p-4 sm:p-6 mb-6 sm:mb-8">
                    <h4 className="text-white font-bold text-base sm:text-lg mb-3 sm:mb-4">👤 Solo Project Summary</h4>
                    <div className="text-center py-6 sm:py-8">
                      <div className="text-4xl sm:text-5xl lg:text-6xl mb-3 sm:mb-4">🏆</div>
                      <h5 className="text-white font-semibold text-base sm:text-lg mb-2">Congratulations!</h5>
                      <p className="text-gray-300 text-sm sm:text-base px-2">
                        You successfully completed this project as a solo developer. 
                        Your dedication and skills have brought this project to completion.
                      </p>
                    </div>
                  </div>
                )}

                <div className="text-center">
                  <h4 className="text-white font-bold text-base sm:text-lg mb-3 sm:mb-4">🚀 What's Next?</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
                    <Link 
                      to="/my-groups"
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-semibold transition-colors text-sm sm:text-base"
                    >
                      📋 View My Groups
                    </Link>
                    <Link 
                      to="/projects/owner-dashboard"
                      className="bg-green-600 hover:bg-green-700 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-semibold transition-colors text-sm sm:text-base"
                    >
                      🏢 My Projects Dashboard
                    </Link>
                  </div>
                  
                  <p className="text-gray-400 text-xs sm:text-sm px-2">
                    {evaluationForm.length > 0 
                      ? '🎉 Team members have received their badge award emails with beautiful badge images! Thank you for leading this project to completion!'
                      : 'Thank you for successfully completing this solo project! Your certificate has been generated and is ready for download. 🎉'
                    }
                  </p>
                </div>
              </div>
            </section>
          )}
        </div>
      </main>
    </div>
  );
};

export default ProjectCompletionPage;
