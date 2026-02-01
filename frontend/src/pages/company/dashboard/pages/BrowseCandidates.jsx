import React, { useState, useEffect } from 'react';
import { Grid, List, Search, Filter, Star, Github, Globe, GraduationCap, MapPin, Check, Briefcase } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/ui/Card';
import { Button } from '../../../../components/ui/Button';
import { Badge } from '../../../../components/ui/Badge';
import { SearchWithHistory } from '../../../../components/ui/SearchWithHistory';
import { COMMON_SKILLS, NEPAL_UNIVERSITIES, NEPAL_CITIES } from '../../../../data/options';
import { toast } from 'sonner';
import axios from 'axios';

const BrowseCandidates = () => {
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [selectedCollege, setSelectedCollege] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [openToWorkFilter, setOpenToWorkFilter] = useState(false);
  const [candidates, setCandidates] = useState([]);
  const [shortlistedIds, setShortlistedIds] = useState(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const fetchCandidates = async () => {
      try {
        const res = await axios.get('http://localhost:6060/api/student/all', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data.success) {
          const mappedData = res.data.data.map(student => ({
            id: student.id,
            userId: student.User?.id,
            name: student.User?.name || 'Unknown',
            headline: student.major ? `${student.major}${student.graduationYear ? ` · ${student.graduationYear}` : ''}` : 'No headline',
            college: student.university || 'N/A',
            year: student.graduationYear || 'N/A',
            location: 'Not Specified',
            skills: student.skills || [],
            matchScore: 0,
            github: student.github,
            portfolio: student.portfolio,
            openToWork: Boolean(student.openToWork),
          }));
          setCandidates(mappedData);
        }
      } catch (error) {
        if (error?.response?.data?.code === 'PROFILE_INCOMPLETE') {
          toast.error('Please complete your company profile first.');
        } else {
          toast.error('Failed to load candidates. Please try again.');
        }
      }
    };
    const fetchShortlisted = async () => {
      try {
        const res = await axios.get('http://localhost:6060/api/company/saved-candidates', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data.success && Array.isArray(res.data.data)) {
          const ids = new Set(
            res.data.data.map((s) => s.User?.id || s.studentId).filter(Boolean)
          );
          setShortlistedIds(ids);
        }
      } catch {
        // ignore; shortlist state will stay empty
      }
    };
    const run = async () => {
      setLoading(true);
      await Promise.all([fetchCandidates(), fetchShortlisted()]);
      setLoading(false);
    };
    run();
  }, []);

  const toggleSkill = (skill) => {
    if (selectedSkills.includes(skill)) {
      setSelectedSkills(selectedSkills.filter((s) => s !== skill));
    } else {
      setSelectedSkills([...selectedSkills, skill]);
    }
  };

  const handleShortlist = async (candidate) => {
    if (!candidate.userId) return;
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(
        `http://localhost:6060/api/company/saved-candidates/${candidate.userId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) {
        toast.success(res.data.saved ? '✓ Candidate added to your shortlist! View them in the Shortlisted section.' : 'Candidate removed from your shortlist.');
        setShortlistedIds((prev) => {
          const next = new Set(prev);
          if (res.data.saved) next.add(candidate.userId);
          else next.delete(candidate.userId);
          return next;
        });
      }
    } catch {
      toast.error('Failed to update shortlist. Please try again.');
    }
  };

  // Filter candidates
  const filteredCandidates = candidates.filter((candidate) => {
    const matchesSearch = candidate.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         candidate.headline.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesSkills = selectedSkills.length === 0 ||
                         selectedSkills.some((skill) => candidate.skills.includes(skill));
    
    const matchesCollege = !selectedCollege || candidate.college === selectedCollege;
    const matchesLocation = !selectedLocation || candidate.location === selectedLocation;
    const matchesOpenToWork = !openToWorkFilter || candidate.openToWork;

    return matchesSearch && matchesSkills && matchesCollege && matchesLocation && matchesOpenToWork;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
            Browse Candidates
          </h1>
          <p className="mt-1 text-gray-600 dark:text-gray-400">
            Discover and connect with talented IT students in Nepal
          </p>
        </div>

        {/* View Toggle */}
        <div className="flex items-center gap-2 rounded-lg border border-gray-300 p-1 dark:border-gray-700">
          <button
            onClick={() => setViewMode('grid')}
            className={`rounded-md p-2 transition-colors ${
              viewMode === 'grid'
                ? 'bg-blue-600 text-white'
                : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'
            }`}
          >
            <Grid size={18} />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`rounded-md p-2 transition-colors ${
              viewMode === 'list'
                ? 'bg-blue-600 text-white'
                : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'
            }`}
          >
            <List size={18} />
          </button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-4">
        {/* Filters Sidebar */}
        <div className="lg:col-span-1">
          <Card className="sticky top-20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Filter size={18} />
                Filters
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Search */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Search
                </label>
                <SearchWithHistory
                  historyKey="company-browse-candidates"
                  placeholder="Name or headline..."
                  value={searchQuery}
                  onChange={setSearchQuery}
                />
              </div>

              {/* Skills */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Skills
                </label>
                <div className="max-h-48 space-y-2 overflow-y-auto">
                  {COMMON_SKILLS.slice(0, 15).map((skill) => (
                    <label key={skill} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={selectedSkills.includes(skill)}
                        onChange={() => toggleSkill(skill)}
                        className="h-4 w-4 rounded text-blue-600"
                      />
                      <span className="text-sm">{skill}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* College */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  College
                </label>
                <select
                  value={selectedCollege}
                  onChange={(e) => setSelectedCollege(e.target.value)}
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700 dark:bg-gray-900"
                >
                  <option value="">All Colleges</option>
                  {NEPAL_UNIVERSITIES.map((uni) => (
                    <option key={uni} value={uni}>
                      {uni}
                    </option>
                  ))}
                </select>
              </div>

              {/* Location */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Location
                </label>
                <select
                  value={selectedLocation}
                  onChange={(e) => setSelectedLocation(e.target.value)}
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700 dark:bg-gray-900"
                >
                  <option value="">All Locations</option>
                  {NEPAL_CITIES.filter(c => c !== 'Remote').map((city) => (
                    <option key={city} value={city}>
                      {city}
                    </option>
                  ))}
                </select>
              </div>

              {/* Open to Work Filter */}
              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={openToWorkFilter}
                    onChange={(e) => setOpenToWorkFilter(e.target.checked)}
                    className="h-4 w-4 rounded text-green-600 focus:ring-green-500"
                  />
                  <div className="flex items-center gap-2">
                    <Briefcase size={16} className="text-green-600" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Show only Open to Work
                    </span>
                  </div>
                </label>
              </div>

              {/* Clear Filters */}
              <Button
                variant="outline"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedSkills([]);
                  setSelectedCollege('');
                  setSelectedLocation('');
                  setOpenToWorkFilter(false);
                }}
                className="w-full"
              >
                Clear All Filters
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Candidates */}
        <div className="lg:col-span-3">
          <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
            Showing {filteredCandidates.length} candidates
          </p>

          {loading ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <span className="text-gray-500">Loading candidates...</span>
              </CardContent>
            </Card>
          ) : filteredCandidates.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <Search size={48} className="mb-4 text-gray-400" />
                <h3 className="mb-2 text-xl font-semibold text-gray-900 dark:text-white">
                  No candidates found
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Try adjusting your filters
                </p>
              </CardContent>
            </Card>
          ) : (
            <div
              className={
                viewMode === 'grid'
                  ? 'grid gap-4 md:grid-cols-2'
                  : 'space-y-4'
              }
            >
              {filteredCandidates.map((candidate) => (
                <Card key={candidate.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      {/* Avatar */}
                      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-blue-700 text-lg font-bold text-white">
                        {candidate.name
                          .split(' ')
                          .map((n) => n[0])
                          .join('')}
                      </div>

                      {/* Info */}
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-bold text-gray-900 dark:text-white">
                                {candidate.name}
                              </h3>
                              {candidate.openToWork && (
                                <Badge className="bg-green-500 text-white font-bold text-[10px] px-2 py-0.5">
                                  <Briefcase size={10} className="mr-1 inline" />
                                  OPEN TO WORK
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {candidate.headline}
                            </p>
                          </div>
                          <Badge variant="default">
                            {candidate.matchScore}%
                          </Badge>
                        </div>

                        {/* Details */}
                        <div className="mt-3 space-y-1 text-sm text-gray-600 dark:text-gray-400">
                          <div className="flex items-center gap-2">
                            <GraduationCap size={14} />
                            <span>
                              {candidate.college} - {candidate.year}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin size={14} />
                            <span>{candidate.location}</span>
                          </div>
                        </div>

                        {/* Skills */}
                        <div className="mt-3 flex flex-wrap gap-1">
                          {candidate.skills.slice(0, 3).map((skill) => (
                            <Badge key={skill} variant="outline" className="text-xs">
                              {skill}
                            </Badge>
                          ))}
                          {candidate.skills.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{candidate.skills.length - 3}
                            </Badge>
                          )}
                        </div>

                        {/* Links */}
                        <div className="mt-3 flex items-center gap-3">
                          {candidate.github && (
                            <a
                              href={candidate.github}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-gray-400 hover:text-blue-600"
                            >
                              <Github size={16} />
                            </a>
                          )}
                          {candidate.portfolio && (
                            <a
                              href={candidate.portfolio}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-gray-400 hover:text-blue-600"
                            >
                              <Globe size={16} />
                            </a>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="mt-4 flex gap-2">
                          {shortlistedIds.has(candidate.userId) ? (
                            <Badge className="gap-1.5 bg-green-100 text-green-800 px-3 py-1.5">
                              <Check size={14} />
                              Shortlisted
                            </Badge>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleShortlist(candidate)}
                              className="gap-2"
                            >
                              <Star size={16} />
                              Shortlist
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BrowseCandidates;
