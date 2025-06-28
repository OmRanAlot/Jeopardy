"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "../components/UI/button"
import { Input } from "../components/UI/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../components/UI/dialog"
import { gameData } from "../lib/game-data"

export default function JeopardyGame() {
  const [players, setPlayers] = useState([{ name: "Player 1", score: 0 }])
  const [currentPlayer, setCurrentPlayer] = useState(0)
  const [gameStarted, setGameStarted] = useState(false)
  const [selectedQuestion, setSelectedQuestion] = useState(null)
  const [showAnswer, setShowAnswer] = useState(false)
  const [playerAnswer, setPlayerAnswer] = useState("")
  const [newPlayerName, setNewPlayerName] = useState("")
  const [gameBoard, setGameBoard] = useState(gameData)
  // Configurable timer duration (in seconds)
  const TIMER_DURATION = 60
  const [timeLeft, setTimeLeft] = useState(TIMER_DURATION)
  const timerRef = useRef(null)
  const [editingPlayer, setEditingPlayer] = useState(null)
  const [scoreAdjustment, setScoreAdjustment] = useState(0)
  const [finalJeopardy, setFinalJeopardy] = useState({
    question: "Split by a strait, this capital city is technically in 2 continents",
    answer: "What is Istanbul?",
    category: "Geography",
    active: false,
    showQuestion: false,
    showAnswer: false,
    completed: false,
    wagers: {},
    answers: {}
  })

  const handleStartGame = () => {
    if (players.length > 0) {
      setGameStarted(true)
    }
  }

  const handleAddPlayer = () => {
    if (newPlayerName.trim() !== "") {
      setPlayers([...players, { name: newPlayerName, score: 0 }])
      setNewPlayerName("")
    }
  }

  const handleSelectQuestion = (category, value) => {
    const categoryIndex = gameBoard.findIndex((cat) => cat.title === category)
    const questionIndex = gameBoard[categoryIndex].questions.findIndex((q) => q.value === value)
    const question = gameBoard[categoryIndex].questions[questionIndex]

    // Reset timer
    setTimeLeft(TIMER_DURATION)
    
    // Clear any existing timer
    if (timerRef.current) {
      clearInterval(timerRef.current)
    }

    setSelectedQuestion({
      category,
      value,
      question: question.question,
      answer: question.answer,
      answered: question.answered || false,
    })

    // Only mark as answered if not already answered
    if (!question.answered) {
      const updatedGameBoard = [...gameBoard]
      updatedGameBoard[categoryIndex].questions[questionIndex] = {
        ...question,
        answered: true
      }
      setGameBoard(updatedGameBoard)
    }
  }

  const handleCloseQuestion = (markAsAnswered = true) => {
    // Clear the timer
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    
    setSelectedQuestion(null)
    setShowAnswer(false)
    setPlayerAnswer("")
    setTimeLeft(TIMER_DURATION) // Reset timer for next question

    // Only move to next player if the question was answered
    if (markAsAnswered) {
      setCurrentPlayer((currentPlayer + 1) % players.length)
    }
  }

  const handleCorrectAnswer = () => {
    if (selectedQuestion && !selectedQuestion.answered) {
      const updatedPlayers = [...players]
      updatedPlayers[currentPlayer].score += selectedQuestion.value
      setPlayers(updatedPlayers)
      handleCloseQuestion(true)
    }
  }

  const handleIncorrectAnswer = () => {
    if (selectedQuestion && !selectedQuestion.answered) {
      const updatedPlayers = [...players]
      updatedPlayers[currentPlayer].score = Math.max(0, updatedPlayers[currentPlayer].score - selectedQuestion.value)
      setPlayers(updatedPlayers)
      handleCloseQuestion(true)
    } else {
      // If the question was already answered, just close without changing scores
      handleCloseQuestion(false)
    }
  }

  const handleAdjustScore = (playerIndex) => {
    setEditingPlayer(playerIndex)
    setScoreAdjustment(0)
  }

  const applyScoreAdjustment = () => {
    if (editingPlayer !== null) {
      const updatedPlayers = [...players]
      updatedPlayers[editingPlayer].score += scoreAdjustment
      setPlayers(updatedPlayers)
      setEditingPlayer(null)
    }
  }

  // Timer effect
  useEffect(() => {
    if (selectedQuestion && !showAnswer && !selectedQuestion.answered) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prevTime) => {
          if (prevTime <= 1) {
            clearInterval(timerRef.current)
            // Auto-submit as incorrect when time runs out
            if (!selectedQuestion.answered) {
              handleIncorrectAnswer()
            }
            return 0
          }
          return prevTime - 1
        })
      }, 1000)
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [selectedQuestion, showAnswer])

  const allQuestionsAnswered = gameBoard.every((category) => category.questions.every((question) => question.answered))
  
  const startFinalJeopardy = () => {
    setFinalJeopardy(prev => ({
      ...prev,
      active: true,
      showQuestion: false,
      showAnswer: false,
      completed: false,
      wagers: {},
      answers: {}
    }))
  }

  const [wagerInputs, setWagerInputs] = useState({})

  const handleWagerInputChange = (playerIndex, value) => {
    setWagerInputs(prev => ({
      ...prev,
      [playerIndex]: value
    }))
  }

  const handleWagerSubmit = (playerIndex) => {
    const value = wagerInputs[playerIndex] || '0'
    const wager = Math.max(0, Math.min(players[playerIndex].score, parseInt(value) || 0))
    
    setFinalJeopardy(prev => {
      const updatedWagers = {
        ...prev.wagers,
        [playerIndex]: wager
      }
      
      // Check if all players have wagered
      const allWagered = players.every((_, idx) => 
        (updatedWagers[idx] || 0) > 0
      )
      
      return {
        ...prev,
        wagers: updatedWagers,
        showQuestion: allWagered
      }
    })
  }

  const handleWagerKeyDown = (e, playerIndex) => {
    if (e.key === 'Enter') {
      handleWagerSubmit(playerIndex)
    }
  }

  const handleFinalCorrect = (playerIndex) => {
    setFinalJeopardy(prev => {
      // Only process if this player hasn't been scored yet
      if (prev.answers[playerIndex] !== undefined) return prev;
      
      const wager = prev.wagers[playerIndex] || 0;
      setPlayers(prevPlayers => {
        const updatedPlayers = [...prevPlayers];
        updatedPlayers[playerIndex] = {
          ...updatedPlayers[playerIndex],
          score: updatedPlayers[playerIndex].score + wager
        };
        return updatedPlayers;
      });
      
      const updatedAnswers = {
        ...prev.answers,
        [playerIndex]: 'correct'
      };
      
      // Check if all players have answered
      const allAnswered = players.every((_, idx) => updatedAnswers[idx] !== undefined);
      
      return {
        ...prev,
        answers: updatedAnswers,
        completed: allAnswered
      };
    });
  };

  const handleFinalIncorrect = (playerIndex) => {
    setFinalJeopardy(prev => {
      // Only process if this player hasn't been scored yet
      if (prev.answers[playerIndex] !== undefined) return prev;
      
      const wager = prev.wagers[playerIndex] || 0;
      setPlayers(prevPlayers => {
        const updatedPlayers = [...prevPlayers];
        updatedPlayers[playerIndex] = {
          ...updatedPlayers[playerIndex],
          score: Math.max(0, updatedPlayers[playerIndex].score - wager)
        };
        return updatedPlayers;
      });
      
      const updatedAnswers = {
        ...prev.answers,
        [playerIndex]: 'incorrect'
      };
      
      // Check if all players have answered
      const allAnswered = players.every((_, idx) => updatedAnswers[idx] !== undefined);
      
      return {
        ...prev,
        answers: updatedAnswers,
        completed: allAnswered
      };
    });
  }

  return (
    <div className="max-w-7xl mx-auto">
      <h1 className="text-4xl md:text-6xl font-bold text-yellow-400 text-center mb-8">JEOPARDY</h1>

      {!gameStarted ? (
        <div className="bg-blue-900 rounded-lg p-6 max-w-md mx-auto">
          <h2 className="text-2xl font-bold text-white mb-4">Player Setup</h2>
          <div className="space-y-4">
            {players.map((player, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-white">{player.name}</span>
                <Button
                className="bg-red-500 hover:bg-red-600"
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    if (players.length > 1) {
                      setPlayers(players.filter((_, i) => i !== index))
                    }
                  }}
                  disabled={players.length <= 1}
                >
                  Remove
                </Button>
              </div>
            ))}

            <div className="flex gap-2">
              <Input
                placeholder="New player name"
                value={newPlayerName}
                onChange={(e) => setNewPlayerName(e.target.value)}
                className="bg-white text-black"
              />
              <Button onClick={handleAddPlayer} className="bg-yellow-500 hover:bg-yellow-600">Add</Button>
            </div>

            <Button
              className="w-full bg-yellow-500 hover:bg-yellow-600 text-blue-900 font-bold"
              onClick={handleStartGame}
            >
              Start Game
            </Button>
          </div>
        </div>
      ) : (
        <div>
          {/* Player scores */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
            {players.map((player, index) => (
              <div
                key={index}
                className={`bg-blue-900 p-4 rounded-lg text-center ${
                  index === currentPlayer ? "ring-4 ring-yellow-400" : ""
                }`}
              >
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-white font-bold">{player.name}</h3>
                  <button 
                    onClick={() => handleAdjustScore(index)}
                    className="text-xs bg-blue-700 hover:bg-blue-600 px-2 py-1 rounded"
                    title="Adjust score"
                  >
                    ±
                  </button>
                </div>
                <p className={`text-2xl font-bold ${player.score >= 0 ? "text-green-400" : "text-red-400"}`}>
                  ${player.score}
                </p>
              </div>
            ))}
          </div>

          {/* Game board */}
          <div className="grid grid-cols-6 gap-2">
            {/* Category headers */}
            {gameBoard.map((category) => (
              <div key={category.title} className="bg-blue-800 p-2 h-24 flex items-center justify-center">
                <h3 className="text-white font-bold text-center text-sm md:text-base">{category.title}</h3>
              </div>
            ))}

            {/* Questions grid */}
            {[0, 1, 2, 3, 4].map((row) =>
              gameBoard.map((category) => (
                <button
                  key={`${category.title}-${category.questions[row].value}`}
                  className={`bg-blue-700 h-16 md:h-20 flex items-center justify-center ${
                    category.questions[row].answered ? "opacity-50" : "hover:bg-blue-600"
                  }`}
                  onClick={() => handleSelectQuestion(category.title, category.questions[row].value)}
                  disabled={category.questions[row].answered}
                >
                  <span className="text-yellow-400 font-bold text-xl md:text-2xl">
                    ${category.questions[row].value}
                  </span>
                </button>
              )),
            )}
          </div>

          {allQuestionsAnswered && !finalJeopardy.active && (
            <div className="mt-8 text-center">
              <h2 className="text-3xl font-bold text-yellow-400 mb-4">Final Jeopardy!</h2>
              <div className="bg-blue-900 p-6 rounded-lg max-w-md mx-auto space-y-4">
                <p className="text-white">Category: <span className="font-bold">{finalJeopardy.category}</span></p>
                <Button
                  className="w-full bg-yellow-500 hover:bg-yellow-600 text-blue-900 font-bold"
                  onClick={startFinalJeopardy}
                >
                  Start Final Jeopardy
                </Button>
              </div>
            </div>
          )}

          {finalJeopardy.active && (
            <div className="mt-8 text-center">
              <h2 className="text-3xl font-bold text-yellow-400 mb-4">Final Jeopardy: {finalJeopardy.category}</h2>
              <div className="bg-blue-900 p-6 rounded-lg max-w-3xl mx-auto space-y-6">
                {!finalJeopardy.showQuestion ? (
                  <div className="space-y-6">
                    <p className="text-white text-xl">Enter your wagers (up to your current score):</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {players.map((player, index) => (
                        <div key={index} className="bg-blue-800 p-4 rounded-lg">
                          <h3 className="text-yellow-400 font-bold text-lg mb-2">{player.name}</h3>
                          <p className="text-white mb-2">Current Score: ${player.score}</p>
                          <div className="flex items-center gap-2">
                            <span className="text-white text-sm whitespace-nowrap">Wager:</span>
                            <div className="relative w-full">
                              <Input
                                type="number"
                                min="0"
                                max={player.score}
                                value={wagerInputs[index] !== undefined ? wagerInputs[index] : ''}
                                onChange={(e) => handleWagerInputChange(index, e.target.value)}
                                onBlur={() => handleWagerSubmit(index)}
                                onKeyDown={(e) => handleWagerKeyDown(e, index)}
                                className="bg-blue-700 text-white border-blue-600 w-full pr-16"
                                placeholder={`0-${player.score}`}
                              />
                              <button
                                type="button"
                                onClick={() => handleWagerSubmit(index)}
                                className="absolute right-2 top-1/2 -translate-y-1/2 bg-blue-600 hover:bg-blue-500 text-xs px-2 py-1 rounded"
                              >
                                Set
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="bg-blue-800 p-4 rounded-lg mb-6">
                    {!finalJeopardy.showAnswer ? (
                      <div className="space-y-4">
                        <p className="text-white text-xl">{finalJeopardy.question}</p>
                        <Button
                          className="bg-yellow-500 hover:bg-yellow-600 text-blue-900 font-bold"
                          onClick={() => setFinalJeopardy(prev => ({ ...prev, showAnswer: true }))}
                        >
                          Show Answer
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <p className="text-white text-xl">{finalJeopardy.question}</p>
                        <div className="bg-blue-700 p-3 rounded">
                          <p className="text-yellow-400 font-bold">Answer:</p>
                          <p className="text-white text-lg">{finalJeopardy.answer}</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {finalJeopardy.showQuestion && finalJeopardy.showAnswer && (
                  <div className="space-y-4">
                    <h3 className="text-2xl text-yellow-400 mb-4">Score Adjustments</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {players.map((player, index) => (
                        <div key={index} className="bg-blue-800 p-4 rounded-lg">
                          <h3 className="text-yellow-400 font-bold text-lg mb-2">{player.name}</h3>
                          <p className="text-white mb-4">Current Score: ${player.score}</p>
                          <div className="space-y-2 w-full">
                            <div className="flex items-center gap-2">
                              <span className="text-white text-sm whitespace-nowrap">Wager:</span>
                              <Input
                                type="number"
                                min="0"
                                max={player.score}
                                value={finalJeopardy.wagers[index] || ''}
                                onChange={(e) => handleWagerInputChange(index, e.target.value)}
                                className="bg-blue-700 text-white border-blue-600 w-full"
                                placeholder={`0-${player.score}`}
                                disabled={finalJeopardy.completed}
                              />
                            </div>
                            <div className="flex gap-2">
                              <Button
                                className="bg-green-600 hover:bg-green-700 flex-1"
                                onClick={() => handleFinalCorrect(index)}
                                disabled={finalJeopardy.answers[index] !== undefined || finalJeopardy.wagers[index] === undefined}
                              >
                                Correct
                              </Button>
                              <Button
                                className="bg-red-600 hover:bg-red-700 flex-1"
                                onClick={() => handleFinalIncorrect(index)}
                                disabled={finalJeopardy.answers[index] !== undefined || finalJeopardy.wagers[index] === undefined}
                              >
                                Incorrect
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {finalJeopardy.completed && (
                  <div className="mt-6 pt-4 border-t border-blue-700">
                    <h3 className="text-2xl text-yellow-400 mb-4">Final Scores</h3>
                    {players
                      .sort((a, b) => b.score - a.score)
                      .map((player, index) => (
                        <div key={index} className="flex justify-between mb-2 px-4">
                          <span className="text-white font-bold">{player.name}</span>
                          <span className={`font-bold ${player.score >= 0 ? "text-green-400" : "text-red-400"}`}>
                            ${player.score}
                          </span>
                        </div>
                      ))}
                    <Button
                      className="w-full mt-6 bg-yellow-500 hover:bg-yellow-600 text-blue-900 font-bold"
                      onClick={() => window.location.reload()}
                    >
                      Play Again
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Question dialog */}
      <Dialog open={selectedQuestion !== null} onOpenChange={(open) => !open && handleCloseQuestion()}>
        <DialogContent className="bg-blue-900 border-blue-700 text-white max-w-2xl">
          <DialogHeader>
            <div className="flex justify-between items-center">
              <DialogTitle className="text-yellow-400 text-xl">
                {selectedQuestion?.category} - ${selectedQuestion?.value}
              </DialogTitle>
              <div className={`text-xl font-bold ${timeLeft <= 10 ? 'text-red-500 animate-pulse' : 'text-yellow-400'}`}>
                {timeLeft}s
              </div>
            </div>
          </DialogHeader>

          <div className="py-8">
            <p className="text-center text-xl md:text-2xl font-medium">{selectedQuestion?.question}</p>
          </div>

          {!showAnswer ? (
            <div className="flex flex-col gap-4">
              <Button
                className="bg-yellow-500 hover:bg-yellow-600 text-blue-900 font-bold"
                onClick={() => setShowAnswer(true)}
              >
                Show Answer
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-blue-800 p-4 rounded-lg">
                <p className="text-center text-xl font-bold text-yellow-400">{selectedQuestion?.answer}</p>
              </div>

              <DialogFooter className="flex flex-col sm:flex-row gap-2">
                <Button className="flex-1 bg-green-600 hover:bg-green-700" onClick={handleCorrectAnswer}>
                  Correct
                </Button>
                <Button className="flex-1 bg-red-600 hover:bg-red-700" onClick={handleIncorrectAnswer}>
                  Incorrect
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Score Adjustment Dialog */}
      <Dialog open={editingPlayer !== null} onOpenChange={(open) => !open && setEditingPlayer(null)}>
        <DialogContent className="bg-blue-900 border-blue-700 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-yellow-400 text-xl">
              Adjust Score for {editingPlayer !== null ? players[editingPlayer]?.name : ''}
            </DialogTitle>
          </DialogHeader>
          
          <div className="py-4">
            <div className="flex items-center gap-4 mb-4">
              <Button 
                onClick={() => setScoreAdjustment(prev => prev - 100)}
                className="bg-red-600 hover:bg-red-700 w-12 h-12 text-2xl"
              >
                -100
              </Button>
              <Button 
                onClick={() => setScoreAdjustment(prev => prev - 10)}
                className="bg-red-600 hover:bg-red-700 w-12 h-12 text-xl"
              >
                -10
              </Button>
              <div className="flex-1 text-center">
                <div className="text-3xl font-bold">
                  {scoreAdjustment >= 0 ? '+' : ''}{scoreAdjustment}
                </div>
                <div className="text-sm opacity-70">
                  New total: ${editingPlayer !== null ? players[editingPlayer]?.score + scoreAdjustment : 0}
                </div>
              </div>
              <Button 
                onClick={() => setScoreAdjustment(prev => prev + 10)}
                className="bg-green-600 hover:bg-green-700 w-12 h-12 text-xl"
              >
                +10
              </Button>
              <Button 
                onClick={() => setScoreAdjustment(prev => prev + 100)}
                className="bg-green-600 hover:bg-green-700 w-12 h-12 text-2xl"
              >
                +100
              </Button>
            </div>
          </div>

          <DialogFooter>
            <Button 
              onClick={() => setEditingPlayer(null)}
              className="bg-gray-500 hover:bg-gray-600"
            >
              Cancel
            </Button>
            <Button 
              onClick={applyScoreAdjustment}
              className="bg-yellow-500 hover:bg-yellow-600 text-blue-900 font-bold"
              disabled={scoreAdjustment === 0}
            >
              Apply
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
